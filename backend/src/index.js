const express = require('express');
const cors = require('cors');
const path = require('path');

const clientesRouter = require('./routes/clientes');
const comandasRouter = require('./routes/comandas');
const relatoriosRouter = require('./routes/relatorios');
const produtosRouter = require('./routes/produtos');
const fiadoRouter = require('./routes/fiado');
const estoqueRouter = require('./routes/estoque');
const { sanitizeInvalidEstoque } = require('./sanitizeEstoque');

const app = express();
app.use(cors());
app.use(express.json());

const originalJson = app.response.json;
app.response.json = function json(body) {
  const safeBody = serializeBigInt(body);
  return originalJson.call(this, safeBody);
};

app.use('/api/clientes', clientesRouter);
app.use('/api/comandas', comandasRouter);
app.use('/api/relatorios', relatoriosRouter);
app.use('/api/produtos', produtosRouter);
app.use('/api/fiado', fiadoRouter);
app.use('/api/estoque', estoqueRouter);

// Serve frontend compilado em produção
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

const PORT = process.env.PORT || 3001;

function serializeBigInt(value) {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeBigInt);
  if (value && typeof value === 'object') {
    const result = {};
    for (const key of Object.keys(value)) {
      result[key] = serializeBigInt(value[key]);
    }
    return result;
  }
  return value;
}

async function startServer() {
  await sanitizeInvalidEstoque(process.env.DATABASE_URL);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Falha ao iniciar o servidor:', error);
  process.exit(1);
});
