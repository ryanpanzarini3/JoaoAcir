const express = require('express');
const cors = require('cors');
const path = require('path');

const clientesRouter = require('./routes/clientes');
const comandasRouter = require('./routes/comandas');
const relatoriosRouter = require('./routes/relatorios');
const produtosRouter = require('./routes/produtos');
const fiadoRouter = require('./routes/fiado');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/clientes', clientesRouter);
app.use('/api/comandas', comandasRouter);
app.use('/api/relatorios', relatoriosRouter);
app.use('/api/produtos', produtosRouter);
app.use('/api/fiado', fiadoRouter);

// Serve frontend compilado em produção
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
