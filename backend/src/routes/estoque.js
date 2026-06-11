const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { parseEstoqueValue } = require('../stock');

// Listar todos os produtos com estoque
router.get('/', async (req, res) => {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
  });
  res.json(produtos);
});

// Atualizar quantidade do estoque de um produto
router.patch('/:id', async (req, res) => {
  const { quantidade } = req.body;
  try {
    const qtd = parseEstoqueValue(quantidade);

    const produto = await prisma.produto.findUnique({ where: { id: Number(req.params.id) } });
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

    const atualizado = await prisma.produto.update({
      where: { id: Number(req.params.id) },
      data: { quantidadeEstoque: qtd },
    });
    res.json(atualizado);
  } catch (error) {
    return res.status(400).json({ erro: error.message });
  }
});

// Excluir produto do estoque (desativa o produto)
router.delete('/:id', async (req, res) => {
  const produto = await prisma.produto.findUnique({ where: { id: Number(req.params.id) } });
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

  await prisma.produto.update({
    where: { id: Number(req.params.id) },
    data: { ativo: false },
  });

  res.json({ ok: true });
});

module.exports = router;
