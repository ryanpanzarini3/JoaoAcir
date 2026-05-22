-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comanda" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clienteId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "local" TEXT NOT NULL DEFAULT 'Balcão',
    "valorTotal" REAL NOT NULL DEFAULT 0,
    "formaPagamento" TEXT,
    "dataAbertura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFechamento" DATETIME,
    CONSTRAINT "Comanda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Comanda" ("clienteId", "dataAbertura", "dataFechamento", "formaPagamento", "id", "status", "valorTotal") SELECT "clienteId", "dataAbertura", "dataFechamento", "formaPagamento", "id", "status", "valorTotal" FROM "Comanda";
DROP TABLE "Comanda";
ALTER TABLE "new_Comanda" RENAME TO "Comanda";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
