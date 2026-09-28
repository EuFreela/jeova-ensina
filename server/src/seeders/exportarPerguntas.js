const fs = require('fs');
const path = require('path');
const perguntas = require('./perguntas.json');

const destino = path.join(__dirname, '..', '..', '..', 'client', 'public', 'data', 'perguntas.json');

function main() {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, `${JSON.stringify(perguntas, null, 2)}\n`, 'utf-8');
  console.log(`${perguntas.length} perguntas exportadas para ${destino}`);
}

if (require.main === module) {
  main();
}

module.exports = { main, destino };
