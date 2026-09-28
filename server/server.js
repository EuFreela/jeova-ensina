require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');

const PORT = Number(process.env.PORT) || 3001;

async function iniciar() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log(`Banco de dados pronto (${sequelize.getDialect()})`);
  } catch (err) {
    console.error('Falha ao conectar no banco de dados:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

iniciar();
