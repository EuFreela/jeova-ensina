const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const perguntaRoutes = require('./routes/perguntaRoutes');
const pontuacaoRoutes = require('./routes/pontuacaoRoutes');
const { notFound, errorHandler } = require('./middlewares/erroMiddleware');
const { geralLimiter } = require('./middlewares/rateLimitMiddleware');

const app = express();

const origensPermitidas = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (origensPermitidas.includes('*') || origensPermitidas.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origem não permitida pelo CORS'));
    },
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(geralLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ambiente: process.env.NODE_ENV || 'development' });
});

app.use('/api/auth', authRoutes);
app.use('/api/perguntas', perguntaRoutes);
app.use('/api/pontuacoes', pontuacaoRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
