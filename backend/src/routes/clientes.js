const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// Listar todos os clientes
router.get('/', async (req, res) => {
  const { busca } = req.query;
  const clientes = await prisma.cliente.findMany({
    where: busca
      ? {
          OR: [
            { nome: { contains: busca } },
            { telefone: { contains: busca } },
          ],
        }
      : undefined,
    orderBy: { nome: 'asc' },
  });
  res.json(clientes);
});

// Buscar cliente por ID
router.get('/:id', async (req, res) => {
  const cliente = await prisma.cliente.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      comandas: true,
      fiadoTransacoes: { orderBy: { data: 'desc' } },
    },
  });
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json(cliente);
});

// Excluir cliente se não houver pendências
router.delete('/:id', async (req, res) => {
  const clienteId = Number(req.params.id);

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    include: { comandas: true },
  });
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const temFiado = cliente.saldoFiado > 0;
  const temComandaAberta = cliente.comandas.some(c => c.status === 'aberta');

  if (temFiado || temComandaAberta) {
    return res.status(400).json({
      erro: temFiado && temComandaAberta
        ? 'Cliente não pode ser excluído porque possui fiado e comanda aberta.'
        : temFiado
          ? 'Cliente não pode ser excluído porque possui fiado em aberto.'
          : 'Cliente não pode ser excluído porque possui comanda aberta.',
    });
  }

  await prisma.cliente.delete({ where: { id: clienteId } });
  res.status(204).end();
});

// Cadastrar cliente
router.post('/', async (req, res) => {
  const { nome, telefone, cpf, observacoes } = req.body;
  if (!nome || !telefone) return res.status(400).json({ erro: 'Nome e telefone são obrigatórios' });
  const cliente = await prisma.cliente.create({
    data: { nome, telefone, cpf, observacoes },
  });
  res.status(201).json(cliente);
});

// Atualizar cliente
router.put('/:id', async (req, res) => {
  const { nome, telefone, cpf, observacoes } = req.body;
  const cliente = await prisma.cliente.update({
    where: { id: Number(req.params.id) },
    data: { nome, telefone, cpf, observacoes },
  });
  res.json(cliente);
});

module.exports = router;
