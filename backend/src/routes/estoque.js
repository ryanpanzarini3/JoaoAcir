const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

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
  if (quantidade === undefined || quantidade === null)
    return res.status(400).json({ erro: 'quantidade é obrigatória' });

  const qtd = Number(quantidade);
  if (isNaN(qtd) || qtd < 0 || qtd > 999999)
    return res.status(400).json({ erro: 'Quantidade inválida (deve estar entre 0 e 999.999)' });

  const produto = await prisma.produto.findUnique({ where: { id: Number(req.params.id) } });
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

  const atualizado = await prisma.produto.update({
    where: { id: Number(req.params.id) },
    data: { quantidadeEstoque: BigInt(qtd) },
  });
  res.json(atualizado);
});

module.exports = router;
