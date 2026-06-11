#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const MAX_ESTOQUE = 999999n;

async function main() {
  console.log('🔄 Iniciando sanitização de estoque...');

  const rows = await prisma.produto.findMany({
    where: {
      OR: [
        { quantidadeEstoque: { lt: 0 } },
        { quantidadeEstoque: { gt: MAX_ESTOQUE } },
      ],
    },
    select: { id: true, nome: true, quantidadeEstoque: true },
  });

  if (rows.length === 0) {
    console.log('✅ Nenhum registro com estoque inválido encontrado.');
    return;
  }

  let updated = 0;

  for (const r of rows) {
    const current = typeof r.quantidadeEstoque === 'bigint' ? r.quantidadeEstoque : BigInt(r.quantidadeEstoque);
    let newVal = current;

    if (current < 0n) newVal = 0n;
    if (current > MAX_ESTOQUE) newVal = MAX_ESTOQUE;

    if (newVal !== current) {
      await prisma.produto.update({
        where: { id: r.id },
        data: { quantidadeEstoque: newVal },
      });
      console.log(`🔧 Atualizado id=${r.id} (${r.nome}): ${current} -> ${newVal}`);
      updated++;
    }
  }

  console.log(`✨ Sanitização concluída. Registros encontrados: ${rows.length}. Atualizados: ${updated}.`);
}

main()
  .catch((e) => {
    console.error('Erro na sanitização:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
