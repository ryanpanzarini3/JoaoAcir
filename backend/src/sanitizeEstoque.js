const path = require('path');
const Database = require('better-sqlite3');

const MAX_ESTOQUE = 999999n;

function resolveDatabasePath(databaseUrl) {
  if (!databaseUrl || !databaseUrl.startsWith('file:')) return null;

  const filePath = databaseUrl.slice(5);
  if (!filePath || filePath === ':memory:') return null;

  if (path.isAbsolute(filePath)) return path.normalize(filePath);

  return path.resolve(__dirname, '..', filePath);
}

function normalizeEstoque(value) {
  const numericValue = typeof value === 'bigint' ? value : BigInt(value);

  return numericValue < 0n ? 0n : numericValue;
}

async function sanitizeInvalidEstoque(databaseUrl) {
  const dbPath = resolveDatabasePath(databaseUrl);
  if (!dbPath) return 0;

  const db = new Database(dbPath);
  db.defaultSafeIntegers(true);

  try {
    const tableExists = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Produto'")
      .get();

    if (!tableExists) return 0;

    const invalidRows = db
      .prepare('SELECT id, quantidadeEstoque FROM Produto WHERE quantidadeEstoque < 0 OR quantidadeEstoque > ?')
      .all(MAX_ESTOQUE);

    if (invalidRows.length === 0) return 0;

    const updateRow = db.prepare('UPDATE Produto SET quantidadeEstoque = ? WHERE id = ?');
    const sanitizeMany = db.transaction((rows) => {
      for (const row of rows) {
        updateRow.run(normalizeEstoque(row.quantidadeEstoque), Number(row.id));
      }
    });

    sanitizeMany(invalidRows);
    console.warn(`[estoque] ${invalidRows.length} registro(s) com estoque inválido foram normalizados.`);
    return invalidRows.length;
  } finally {
    db.close();
  }
}

module.exports = {
  MAX_ESTOQUE: Number(MAX_ESTOQUE),
  sanitizeInvalidEstoque,
};