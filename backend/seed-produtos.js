const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db').replace(/\\/g, '/');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const produtos = [
  // Cervejas
  { nome: 'Brahma Lata 350ml', categoria: 'Cerveja', preco: 6.00 },
  { nome: 'Brahma Long Neck 355ml', categoria: 'Cerveja', preco: 8.00 },
  { nome: 'Skol Lata 350ml', categoria: 'Cerveja', preco: 5.50 },
  { nome: 'Skol Long Neck 355ml', categoria: 'Cerveja', preco: 7.50 },
  { nome: 'Heineken Long Neck 330ml', categoria: 'Cerveja', preco: 12.00 },
  { nome: 'Budweiser Long Neck 330ml', categoria: 'Cerveja', preco: 10.00 },
  { nome: 'Original 600ml', categoria: 'Cerveja', preco: 14.00 },
  { nome: 'Itaipava Lata 350ml', categoria: 'Cerveja', preco: 5.00 },
  // Drinks
  { nome: 'Caipirinha Limão', categoria: 'Drinks', preco: 18.00 },
  { nome: 'Caipirinha Morango', categoria: 'Drinks', preco: 20.00 },
  { nome: 'Caipiroska Limão', categoria: 'Drinks', preco: 20.00 },
  { nome: 'Gin Tônica', categoria: 'Drinks', preco: 25.00 },
  // Não-alcoólicos
  { nome: 'Coca-Cola Lata 350ml', categoria: 'Refrigerante', preco: 7.00 },
  { nome: 'Pepsi Lata 350ml', categoria: 'Refrigerante', preco: 6.00 },
  { nome: 'Guaraná Antarctica Lata', categoria: 'Refrigerante', preco: 6.00 },
  { nome: 'Água Mineral 500ml', categoria: 'Água', preco: 4.00 },
  { nome: 'Água com Gás 500ml', categoria: 'Água', preco: 5.00 },
  { nome: 'Suco de Laranja 300ml', categoria: 'Sucos', preco: 10.00 },
  { nome: 'Suco de Maracujá 300ml', categoria: 'Sucos', preco: 10.00 },
  // Comidas
  { nome: 'Porção de Fritas', categoria: 'Porções', preco: 25.00 },
  { nome: 'Porção de Calabresa', categoria: 'Porções', preco: 30.00 },
  { nome: 'Porção de Frango', categoria: 'Porções', preco: 32.00 },
  { nome: 'Espetinho de Carne', categoria: 'Espetinhos', preco: 8.00 },
  { nome: 'Espetinho de Frango', categoria: 'Espetinhos', preco: 7.00 },
  { nome: 'Espetinho Misto', categoria: 'Espetinhos', preco: 9.00 },
];

async function main() {
  // Limpa produtos existentes para não duplicar no re-seed
  const existentes = await prisma.produto.count();
  if (existentes > 0) {
    console.log(`Já existem ${existentes} produtos. Pulando seed.`);
    return;
  }

  for (const p of produtos) {
    await prisma.produto.create({ data: p });
  }
  console.log(`${produtos.length} produtos criados com sucesso!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
