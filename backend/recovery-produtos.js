const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const produtosComEstoque = [
  // Cervejas
  { nome: 'Brahma Lata 350ml', categoria: 'Cerveja', preco: 6.00, quantidadeEstoque: 50 },
  { nome: 'Brahma Long Neck 355ml', categoria: 'Cerveja', preco: 8.00, quantidadeEstoque: 30 },
  { nome: 'Skol Lata 350ml', categoria: 'Cerveja', preco: 5.50, quantidadeEstoque: 45 },
  { nome: 'Skol Long Neck 355ml', categoria: 'Cerveja', preco: 7.50, quantidadeEstoque: 25 },
  { nome: 'Heineken Long Neck 330ml', categoria: 'Cerveja', preco: 12.00, quantidadeEstoque: 20 },
  { nome: 'Budweiser Long Neck 330ml', categoria: 'Cerveja', preco: 10.00, quantidadeEstoque: 15 },
  { nome: 'Original 600ml', categoria: 'Cerveja', preco: 14.00, quantidadeEstoque: 10 },
  { nome: 'Itaipava Lata 350ml', categoria: 'Cerveja', preco: 5.00, quantidadeEstoque: 40 },
  // Drinks
  { nome: 'Caipirinha Limão', categoria: 'Drinks', preco: 18.00, quantidadeEstoque: 0 },
  { nome: 'Caipirinha Morango', categoria: 'Drinks', preco: 20.00, quantidadeEstoque: 0 },
  { nome: 'Caipiroska Limão', categoria: 'Drinks', preco: 20.00, quantidadeEstoque: 0 },
  { nome: 'Gin Tônica', categoria: 'Drinks', preco: 25.00, quantidadeEstoque: 0 },
  // Não-alcoólicos
  { nome: 'Coca-Cola Lata 350ml', categoria: 'Refrigerante', preco: 7.00, quantidadeEstoque: 35 },
  { nome: 'Pepsi Lata 350ml', categoria: 'Refrigerante', preco: 6.00, quantidadeEstoque: 30 },
  { nome: 'Guaraná Antarctica Lata', categoria: 'Refrigerante', preco: 6.00, quantidadeEstoque: 25 },
  { nome: 'Água Mineral 500ml', categoria: 'Água', preco: 4.00, quantidadeEstoque: 100 },
  { nome: 'Água com Gás 500ml', categoria: 'Água', preco: 5.00, quantidadeEstoque: 50 },
  { nome: 'Suco de Laranja 300ml', categoria: 'Sucos', preco: 10.00, quantidadeEstoque: 15 },
  { nome: 'Suco de Maracujá 300ml', categoria: 'Sucos', preco: 10.00, quantidadeEstoque: 12 },
  // Comidas
  { nome: 'Porção de Fritas', categoria: 'Porções', preco: 25.00, quantidadeEstoque: 20 },
  { nome: 'Porção de Calabresa', categoria: 'Porções', preco: 30.00, quantidadeEstoque: 15 },
  { nome: 'Porção de Frango', categoria: 'Porções', preco: 32.00, quantidadeEstoque: 12 },
  { nome: 'Espetinho de Carne', categoria: 'Espetinhos', preco: 8.00, quantidadeEstoque: 100 },
  { nome: 'Espetinho de Frango', categoria: 'Espetinhos', preco: 7.00, quantidadeEstoque: 120 },
  { nome: 'Espetinho Misto', categoria: 'Espetinhos', preco: 9.00, quantidadeEstoque: 80 },
];

async function main() {
  console.log('🔄 Iniciando recuperação de produtos...');
  
  try {
    // Limpa produtos antigos/corrompidos
    const deletados = await prisma.produto.deleteMany({});
    console.log(`✅ ${deletados.count} produtos deletados (limpeza)`);

    // Recria os produtos
    for (const p of produtosComEstoque) {
      await prisma.produto.create({ data: p });
    }
    
    console.log(`✅ ${produtosComEstoque.length} produtos restaurados com sucesso!`);
    console.log('✨ Cardápio e estoque recuperados!');
  } catch (error) {
    console.error('❌ Erro na recuperação:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
