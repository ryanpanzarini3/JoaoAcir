-- CreateTable
CREATE TABLE "Produto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Outros',
    "preco" REAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);
