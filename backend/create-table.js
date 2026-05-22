const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'dev.db'));

db.exec(`CREATE TABLE IF NOT EXISTS "Produto" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "nome" TEXT NOT NULL,
  "categoria" TEXT NOT NULL DEFAULT 'Outros',
  "preco" REAL NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT 1
)`);

console.log('Tabela Produto criada com sucesso!');
db.close();
