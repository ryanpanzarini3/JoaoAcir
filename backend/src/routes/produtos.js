const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { parseEstoqueValue } = require('../stock');

// Listar produtos ativos (agrupados por categoria)
router.get('/', async (req, res) => {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
  });
  res.json(produtos);
});

// Listar todos (admin)
router.get('/todos', async (req, res) => {
  const produtos = await prisma.produto.findMany({
    orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
  });
  res.json(produtos);
});

// Criar produto
router.post('/', async (req, res) => {
  const { nome, categoria, preco } = req.body;
  if (!nome || preco == null) return res.status(400).json({ erro: 'nome e preco são obrigatórios' });
  const produto = await prisma.produto.create({
    data: { nome, categoria: categoria || 'Outros', preco: Number(preco) },
  });
  res.status(201).json(produto);
});

// Atualizar produto
router.put('/:id', async (req, res) => {
  const { nome, categoria, preco, ativo, quantidadeEstoque } = req.body;

  try {
    const data = {
      ...(nome != null && { nome }),
      ...(categoria != null && { categoria }),
      ...(preco != null && { preco: Number(preco) }),
      ...(ativo != null && { ativo }),
    };

    if (quantidadeEstoque != null) {
      data.quantidadeEstoque = parseEstoqueValue(quantidadeEstoque);
    }

    const produto = await prisma.produto.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(produto);
  } catch (error) {
    return res.status(400).json({ erro: error.message });
  }
});

// Deletar (desativar) produto
router.delete('/:id', async (req, res) => {
  await prisma.produto.update({
    where: { id: Number(req.params.id) },
    data: { ativo: false },
  });
  res.json({ ok: true });
});

module.exports = router;
