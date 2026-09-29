const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const perguntaRoutes = require('./routes/perguntaRoutes');
const pontuacaoRoutes = require('./routes/pontuacaoRoutes');
const { notFound, errorHandler } = require('./middlewares/erroMiddleware');
const { geralLimiter } = require('./middlewares/rateLimitMiddleware');
const { origemLiberada } = require('./config/origens');

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origemLiberada(origin)) {
        return callback(new Error('Origem não permitida pelo CORS'));
      }
      return callback(null, true);
    },
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(geralLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ambiente: process.env.NODE_ENV || 'development' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/perguntas', perguntaRoutes);
app.use('/api/pontuacoes', pontuacaoRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
