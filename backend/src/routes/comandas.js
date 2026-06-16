const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// Listar todas as comandas (abertas por padrão)
router.get('/', async (req, res) => {
  const { status } = req.query;
  const comandas = await prisma.comanda.findMany({
    where: status ? { status } : undefined,
    include: { cliente: true, itens: true },
    orderBy: { dataAbertura: 'desc' },
  });
  res.json(comandas);
});

// Buscar comanda por ID
router.get('/:id', async (req, res) => {
  const comanda = await prisma.comanda.findUnique({
    where: { id: Number(req.params.id) },
    include: { cliente: true, itens: true },
  });
  if (!comanda) return res.status(404).json({ erro: 'Comanda não encontrada' });
  res.json(comanda);
});

// Abrir nova comanda
router.post('/', async (req, res) => {
  const { clienteId, local } = req.body;
  if (!clienteId) return res.status(400).json({ erro: 'clienteId é obrigatório' });
  const comanda = await prisma.comanda.create({
    data: { clienteId: Number(clienteId), local: local || 'Balcão' },
    include: { cliente: true },
  });
  res.status(201).json(comanda);
});

// Adicionar item à comanda
router.post('/:id/itens', async (req, res) => {
  const { nomeProduto, quantidade, valorUnitario } = req.body;
  if (!nomeProduto || !quantidade || !valorUnitario)
    return res.status(400).json({ erro: 'nomeProduto, quantidade e valorUnitario são obrigatórios' });

  const comandaId = Number(req.params.id);
  const qtd = Number(quantidade);
  const valorUnitarioNum = Number(valorUnitario);

  // Verifica e debita estoque se houver produto cadastrado com esse nome
  const produto = await prisma.produto.findFirst({ where: { nome: nomeProduto, ativo: true } });
  if (produto) {
    if (produto.quantidadeEstoque < qtd) {
      return res.status(400).json({ erro: `Estoque insuficiente. Disponível: ${produto.quantidadeEstoque} unidade(s).` });
    }
    await prisma.produto.update({
      where: { id: produto.id },
      data: { quantidadeEstoque: { decrement: BigInt(qtd) } },
    });
  }

  // Verifica se o item já existe na comanda
  const itensExistentes = await prisma.itemComanda.findMany({
    where: { comandaId, nomeProduto },
    orderBy: { id: 'asc' },
  });

  let item;
  if (itensExistentes.length > 0) {
    const itemPrincipal = itensExistentes[0];
    const quantidadeExistente = itensExistentes.reduce((acc, i) => acc + i.quantidade, 0);
    const novaQuantidade = quantidadeExistente + qtd;
    const novoValorTotal = novaQuantidade * valorUnitarioNum;

    if (itensExistentes.length > 1) {
      const idsParaExcluir = itensExistentes.slice(1).map(i => i.id);
      await prisma.itemComanda.deleteMany({ where: { id: { in: idsParaExcluir } } });
    }

    item = await prisma.itemComanda.update({
      where: { id: itemPrincipal.id },
      data: {
        quantidade: novaQuantidade,
        valorUnitario: valorUnitarioNum,
        valorTotal: novoValorTotal,
      },
    });
  } else {
    const valorTotal = qtd * valorUnitarioNum;
    item = await prisma.itemComanda.create({
      data: { comandaId, nomeProduto, quantidade: qtd, valorUnitario: valorUnitarioNum, valorTotal },
    });
  }

  // Atualizar valor total da comanda
  const itens = await prisma.itemComanda.findMany({ where: { comandaId } });
  const novoTotal = itens.reduce((acc, i) => acc + i.valorTotal, 0);
  await prisma.comanda.update({ where: { id: comandaId }, data: { valorTotal: novoTotal } });

  res.status(201).json(item);
});

// Remover item da comanda
router.delete('/:id/itens/:itemId', async (req, res) => {
  const comandaId = Number(req.params.id);
  const item = await prisma.itemComanda.findUnique({ where: { id: Number(req.params.itemId) } });

  if (item) {
    // Devolve ao estoque se o produto existir
    const produto = await prisma.produto.findFirst({ where: { nome: item.nomeProduto, ativo: true } });
    if (produto) {
      await prisma.produto.update({
        where: { id: produto.id },
        data: { quantidadeEstoque: { increment: BigInt(item.quantidade) } },
      });
    }
    await prisma.itemComanda.delete({ where: { id: item.id } });
  }

  const itens = await prisma.itemComanda.findMany({ where: { comandaId } });
  const novoTotal = itens.reduce((acc, i) => acc + i.valorTotal, 0);
  await prisma.comanda.update({ where: { id: comandaId }, data: { valorTotal: novoTotal } });

  res.status(204).end();
});

// Remover apenas uma unidade de um item da comanda
router.patch('/:id/itens/:itemId', async (req, res) => {
  const comandaId = Number(req.params.id);
  const quantidade = Number(req.body.quantidade);
  if (!quantidade || quantidade < 1) {
    return res.status(400).json({ erro: 'quantidade deve ser maior que zero' });
  }

  const item = await prisma.itemComanda.findUnique({ where: { id: Number(req.params.itemId) } });
  if (!item) return res.status(404).json({ erro: 'Item não encontrado' });

  const produto = await prisma.produto.findFirst({ where: { nome: item.nomeProduto, ativo: true } });
  if (produto) {
    await prisma.produto.update({
      where: { id: produto.id },
      data: { quantidadeEstoque: { increment: BigInt(quantidade) } },
    });
  }

  const novaQuantidade = item.quantidade - quantidade;
  if (novaQuantidade <= 0) {
    await prisma.itemComanda.delete({ where: { id: item.id } });
  } else {
    const valorUnitarioNum = Number(item.valorUnitario);
    await prisma.itemComanda.update({
      where: { id: item.id },
      data: {
        quantidade: novaQuantidade,
        valorTotal: novaQuantidade * valorUnitarioNum,
      },
    });
  }

  const itens = await prisma.itemComanda.findMany({ where: { comandaId } });
  const novoTotal = itens.reduce((acc, i) => acc + i.valorTotal, 0);
  await prisma.comanda.update({ where: { id: comandaId }, data: { valorTotal: novoTotal } });

  res.status(204).end();
});

// Fechar comanda
router.patch('/:id/fechar', async (req, res) => {
  const { formaPagamento } = req.body;
  if (!formaPagamento) return res.status(400).json({ erro: 'formaPagamento é obrigatório' });

  const comandaId = Number(req.params.id);
  const comanda = await prisma.comanda.findUnique({
    where: { id: comandaId },
    include: { cliente: true },
  });
  if (!comanda) return res.status(404).json({ erro: 'Comanda não encontrada' });

  const ops = [
    prisma.comanda.update({
      where: { id: comandaId },
      data: { status: 'fechada', formaPagamento, dataFechamento: new Date() },
      include: { cliente: true, itens: true },
    }),
  ];

  // Se for fiado, adiciona ao saldo do cliente
  if (formaPagamento === 'Fiado') {
    const itens = await prisma.itemComanda.findMany({ where: { comandaId } });
    const linhasItens = itens.map(i => `• ${i.quantidade}x ${i.nomeProduto} — R$ ${i.valorTotal.toFixed(2).replace('.', ',')}`);
    const descricao = [`Comanda #${comandaId} — ${new Date().toLocaleDateString('pt-BR')}`, ...linhasItens].join('\n');
    ops.push(
      prisma.cliente.update({
        where: { id: comanda.clienteId },
        data: { saldoFiado: { increment: comanda.valorTotal } },
      }),
      prisma.fiadoTransacao.create({
        data: {
          clienteId: comanda.clienteId,
          valor: comanda.valorTotal,
          descricao,
        },
      })
    );
  }

  const [comandaFechada] = await prisma.$transaction(ops);
  res.json(comandaFechada);
});

module.exports = router;
