const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// Stats do dia (para o header)
router.get('/stats-hoje', async (req, res) => {
  const hoje = new Date();
  const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const fimDia    = new Date(inicioDia.getTime() + 86400000);

  const [fechadasHoje, abertas] = await Promise.all([
    prisma.comanda.findMany({
      where: { status: 'fechada', dataFechamento: { gte: inicioDia, lt: fimDia } },
      select: { valorTotal: true },
    }),
    prisma.comanda.count({ where: { status: 'aberta' } }),
  ]);

  const faturamentoHoje = fechadasHoje.reduce((acc, c) => acc + c.valorTotal, 0);
  res.json({ faturamentoHoje, comandasAtivas: abertas });
});

// Helpers para montar filtro de data
function filtroData(req) {
  const where = { status: 'fechada' };
  if (req.query.inicio || req.query.fim) {
    where.dataFechamento = {};
    if (req.query.inicio) where.dataFechamento.gte = new Date(req.query.inicio + 'T00:00:00');
    if (req.query.fim)    where.dataFechamento.lte = new Date(req.query.fim   + 'T23:59:59.999');
  }
  return where;
}

// Total de vendas por dia
router.get('/vendas-por-dia', async (req, res) => {
  const comandas = await prisma.comanda.findMany({
    where: filtroData(req),
    select: { dataFechamento: true, valorTotal: true },
    orderBy: { dataFechamento: 'desc' },
  });

  const agrupado = {};
  for (const c of comandas) {
    if (!c.dataFechamento) continue;
    const data = c.dataFechamento.toISOString().split('T')[0];
    if (!agrupado[data]) agrupado[data] = { data, total: 0, totalComandas: 0 };
    agrupado[data].total += c.valorTotal;
    agrupado[data].totalComandas += 1;
  }

  res.json(Object.values(agrupado));
});

// Clientes mais frequentes
router.get('/clientes-frequentes', async (req, res) => {
  const whereComanda = filtroData(req);
  const clientes = await prisma.cliente.findMany({
    include: { comandas: { where: whereComanda, select: { valorTotal: true } } },
  });

  const resultado = clientes
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      totalComandas: c.comandas.length,
      totalGasto: c.comandas.reduce((s, cmd) => s + (cmd.valorTotal || 0), 0),
    }))
    .filter((c) => c.totalComandas > 0)
    .sort((a, b) => b.totalComandas - a.totalComandas)
    .slice(0, 10);

  res.json(resultado);
});

// Produtos mais vendidos
router.get('/produtos-mais-vendidos', async (req, res) => {
  const whereComanda = filtroData(req);
  const itens = await prisma.itemComanda.findMany({
    include: { comanda: { select: { status: true, dataFechamento: true } } },
  });

  // Filtra pelo status + intervalo de data (já que não tem where direto no include aqui)
  const inicio = req.query.inicio ? new Date(req.query.inicio + 'T00:00:00') : null;
  const fim    = req.query.fim    ? new Date(req.query.fim    + 'T23:59:59.999') : null;

  const agrupado = {};
  for (const item of itens) {
    if (item.comanda.status !== 'fechada') continue;
    const df = item.comanda.dataFechamento;
    if (inicio && df < inicio) continue;
    if (fim    && df > fim)    continue;
    const nome = item.nomeProduto;
    if (!agrupado[nome]) agrupado[nome] = { nomeProduto: nome, totalQuantidade: 0, totalVendido: 0 };
    agrupado[nome].totalQuantidade += item.quantidade;
    agrupado[nome].totalVendido    += item.valorTotal;
  }

  const resultado = Object.values(agrupado).sort((a, b) => b.totalQuantidade - a.totalQuantidade);
  res.json(resultado);
});

// Histórico de consumo por cliente
router.get('/historico-cliente/:id', async (req, res) => {
  const cliente = await prisma.cliente.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      comandas: {
        where: { status: 'fechada' },
        include: { itens: true },
        orderBy: { dataFechamento: 'desc' },
      },
    },
  });
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json(cliente);
});

module.exports = router;
