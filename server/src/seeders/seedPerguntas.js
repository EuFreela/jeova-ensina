const sequelize = require('../config/database');
const Pergunta = require('../models/Pergunta');
const perguntas = require('./perguntas.json');

async function seedPerguntas({ forcar = false } = {}) {
  const existentes = await Pergunta.count();

  if (existentes > 0 && !forcar) {
    console.log(`Já existem ${existentes} perguntas no banco. Use --forcar para recriar.`);
    return { criadas: 0, ignoradas: existentes };
  }

  if (forcar && existentes > 0) {
    await Pergunta.destroy({ where: {}, truncate: true });
    console.log(`${existentes} perguntas removidas.`);
  }

  const registros = perguntas.map((p) => ({
    pergunta: p.pergunta,
    opcoes: p.opcoes,
    resposta_correta: p.resposta_correta,
    categoria: p.categoria,
    dificuldade: p.dificuldade,
    referencia: p.referencia,
  }));

  const criadas = await Pergunta.bulkCreate(registros);
  console.log(`${criadas.length} perguntas inseridas.`);

  const porDificuldade = criadas.reduce((acc, p) => {
    acc[p.dificuldade] = (acc[p.dificuldade] || 0) + 1;
    return acc;
  }, {});
  console.log('Por dificuldade:', porDificuldade);

  return { criadas: criadas.length, ignoradas: 0 };
}

async function main() {
  const forcar = process.argv.includes('--forcar');
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await seedPerguntas({ forcar });
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Erro ao popular o banco:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedPerguntas };
