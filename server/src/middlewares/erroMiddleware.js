function notFound(req, res) {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    console.error('[erro]', err);
  }

  res.status(status).json({
    error: status >= 500 && process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
    ...(process.env.NODE_ENV === 'development' && err.errors ? { errors: err.errors.map((e) => e.message) } : {}),
  });
}

module.exports = { notFound, errorHandler };
