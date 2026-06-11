const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// Listar todos os clientes com fiado em aberto
router.get('/', async (req, res) => {
  const clientes = await prisma.cliente.findMany({
    where: { saldoFiado: { gt: 0 } },
    include: {
      fiadoTransacoes: {
        where: { valor: { gt: 0 } },
        orderBy: { data: 'desc' },
        take: 1,
      },
    },
    orderBy: { saldoFiado: 'desc' },
  });
  const result = clientes.map(c => ({
    ...c,
    ultimoFiado: c.fiadoTransacoes[0]?.data || null,
  }));
  res.json(result);
});

// Histórico de fiado de um cliente
router.get('/:clienteId', async (req, res) => {
  const clienteId = Number(req.params.clienteId);
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    include: {
      fiadoTransacoes: { orderBy: { data: 'desc' } },
    },
  });
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json(cliente);
});

// Registrar pagamento de fiado
router.post('/:clienteId/pagar', async (req, res) => {
  const clienteId = Number(req.params.clienteId);
  const { valor, descricao } = req.body;
  if (!valor || Number(valor) <= 0)
    return res.status(400).json({ erro: 'Valor inválido' });

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const valorPago = Math.min(Number(valor), cliente.saldoFiado);
  const novoSaldo = Math.max(0, cliente.saldoFiado - valorPago);

  const [clienteAtualizado] = await prisma.$transaction([
    prisma.cliente.update({
      where: { id: clienteId },
      data: { saldoFiado: novoSaldo },
    }),
    prisma.fiadoTransacao.create({
      data: {
        clienteId,
        valor: -valorPago,
        descricao: descricao || 'Pagamento de fiado',
      },
    }),
  ]);

  res.json(clienteAtualizado);
});

// Registrar novo valor de fiado para um cliente
router.post('/:clienteId/fiar', async (req, res) => {
  const clienteId = Number(req.params.clienteId);
  const { valor, descricao } = req.body;
  const valorNumerico = Number(String(valor).replace(',', '.'));

  if (!valor || !Number.isFinite(valorNumerico) || valorNumerico <= 0) {
    return res.status(400).json({ erro: 'Valor inválido' });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const novoSaldo = cliente.saldoFiado + valorNumerico;

  const [clienteAtualizado] = await prisma.$transaction([
    prisma.cliente.update({
      where: { id: clienteId },
      data: { saldoFiado: novoSaldo },
    }),
    prisma.fiadoTransacao.create({
      data: {
        clienteId,
        valor: valorNumerico,
        descricao: descricao || 'Fiado manual',
      },
    }),
  ]);

  res.json(clienteAtualizado);
});

module.exports = router;
