const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const perguntaRoutes = require('./routes/perguntaRoutes');
const pontuacaoRoutes = require('./routes/pontuacaoRoutes');
const { notFound, errorHandler } = require('./middlewares/erroMiddleware');
const { geralLimiter } = require('./middlewares/rateLimitMiddleware');
const { origemLiberada } = require('./config/origens');

const app = express();

// Sem isto o rate limit usa req.ip, que atras de um proxy e o IP do proxy:
// todo mundo cai no mesmo contador e um atacante trava o login de todos.
// Os saltos saem do TRUST_PROXY; 1 e o padrao em Vercel/Render/Railway.
if (process.env.TRUST_PROXY) {
  const saltos = Number(process.env.TRUST_PROXY);
  app.set('trust proxy', Number.isFinite(saltos) && saltos > 0 ? saltos : 1);
}

// Headers de seguranca (CSP, X-Content-Type-Options, X-Frame-Options,
// Referrer-Policy, HSTS...). crossOriginResourcePolicy liberado porque a
// API responde em outro host que o frontend.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

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
  res.set('Cache-Control', 'no-store');
  res.json({ status: 'ok', ambiente: process.env.NODE_ENV || 'development' });
});

// Login e troca de senha devolvem credencial: nada ali pode ficar em cache
// de proxy nem no historico do navegador.
app.use(
  '/api/auth',
  (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  },
  authRoutes
);
app.use('/api/admin', adminRoutes);
app.use('/api/perguntas', perguntaRoutes);
app.use('/api/pontuacoes', pontuacaoRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
