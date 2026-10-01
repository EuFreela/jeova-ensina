/**
 * Migracao de banco legado.
 *
 * Este arquivo roda FORA de `helpers/banco.js` de proposito. O banco de teste
 * la e `:memory:` e criado por `sync({force:true})`, ou seja, ja nasce com
 * TODAS as colunas — inclusive as novas. Testar a migracao nele seria testar
 * um banco que nunca existiu em producao.
 *
 * Aqui o schema antigo e montado a mao, em um arquivo SQLite descartavel, e a
 * migracao roda sobre ele. E o caminho que um deploy real percorre: um banco
 * criado antes das colunas novas, que precisa de ALTER e de conversao de
 * dados sem perder o que ja estava gravado.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ARQUIVO = path.join(os.tmpdir(), `jeova-migracao-${process.pid}.sqlite`);

// Precisa vir antes de qualquer require de `config/database`, que le o
// ambiente na carga do modulo.
process.env.NODE_ENV = 'test';
process.env.DATABASE_DIALECT = 'sqlite';
process.env.DATABASE_STORAGE = ARQUIVO;
process.env.JWT_SECRET = 'segredo-de-teste-com-tamanho-suficiente-0123456789';

const sequelize = require('../src/config/database');
const { migrarColunas } = require('../src/seeders/migracoes');
const { guardarSeguro } = require('../src/utils/codigo');

/**
 * Schema de uma versao anterior: tem o codigo inicial em TEXTO PURO e nao tem
 * `codigo_guardado` nem `ranking_publico`.
 */
const LEGADO = `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'player',
    must_change_password BOOLEAN NOT NULL DEFAULT 0,
    senha_expira_em DATETIME,
    codigo VARCHAR(4) UNIQUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
  )
`;

test.after(async () => {
  await sequelize.close();
  for (const sufixo of ['', '-journal', '-wal', '-shm']) {
    fs.rmSync(ARQUIVO + sufixo, { force: true });
  }
});

test.before(async () => {
  await sequelize.authenticate();
  await sequelize.query(LEGADO);
  await sequelize.query(
    `INSERT INTO users (username, password, role, must_change_password, senha_expira_em, codigo, created_at, updated_at)
     VALUES ('ana', 'hash-antigo', 'player', 1, '2030-01-01 00:00:00.000 +00:00', '4321', '2024-01-01 00:00:00.000 +00:00', '2024-01-01 00:00:00.000 +00:00'),
            ('bruno', 'hash-antigo', 'player', 1, '2030-01-01 00:00:00.000 +00:00', '8765', '2024-01-01 00:00:00.000 +00:00', '2024-01-01 00:00:00.000 +00:00')`
  );
});

test('a migracao cria as colunas novas no banco legado', async () => {
  const qi = sequelize.getQueryInterface();

  const antes = await qi.describeTable('users');
  assert.equal(antes.codigo_guardado, undefined, 'o ponto de partida e um banco sem a coluna');
  assert.equal(antes.ranking_publico, undefined);

  await migrarColunas();

  const depois = await qi.describeTable('users');
  assert.ok(depois.codigo_guardado, 'users.codigo_guardado foi criada');
  assert.ok(depois.ranking_publico, 'users.ranking_publico foi criada');
});

test('a migracao troca o codigo em claro pelo HMAC, sem perder a conta', async () => {
  const [linhas] = await sequelize.query(
    "SELECT username, password, must_change_password, senha_expira_em, codigo, codigo_guardado FROM users WHERE username = 'ana'"
  );
  const ana = linhas[0];

  // O texto puro sumiu: e a senha de acesso de quem ainda nao trocou a senha.
  assert.equal(ana.codigo, null);
  assert.equal(ana.codigo_guardado, guardarSeguro('4321'));

  // A conta em si continua inteira — idem a senha com hash.
  assert.equal(ana.username, 'ana');
  assert.equal(ana.password, 'hash-antigo', 'o hash existente nao foi tocado');
  assert.equal(ana.must_change_password, 1);
  assert.ok(ana.senha_expira_em);
});

test('a migracao converte todas as contas, nao so a primeira', async () => {
  const [linhas] = await sequelize.query("SELECT codigo, codigo_guardado FROM users WHERE username = 'bruno'");
  const bruno = linhas[0];
  assert.equal(bruno.codigo, null);
  assert.equal(bruno.codigo_guardado, guardarSeguro('8765'));
});

test('rodar a migracao de novo nao muda nada', async () => {
  await migrarColunas();
  await migrarColunas();

  const [todos] = await sequelize.query(
    'SELECT username, codigo, codigo_guardado FROM users ORDER BY username'
  );
  assert.equal(todos.length, 2);
  for (const linha of todos) {
    assert.equal(linha.codigo, null, `${linha.username} continua sem codigo em claro`);
    assert.ok(linha.codigo_guardado, `${linha.username} continua com o HMAC`);
  }
});

test('o indice unico do HMAC existe e barra codigo repetido', async () => {
  const qi = sequelize.getQueryInterface();
  const indices = await qi.showIndex('users');
  const alvo = indices.find((i) => i.name === 'users_codigo_guardado_unique');
  assert.ok(alvo, 'o indice unico foi criado');
  assert.equal(alvo.unique, true);

  // A unicidade e o que impede duas contas com o mesmo codigo inicial.
  await assert.rejects(
    sequelize.query("INSERT INTO users (username, password, codigo_guardado, created_at, updated_at) VALUES ('carla', 'x', ?, '2024-01-01', '2024-01-01')", {
      replacements: [guardarSeguro('4321')],
    })
  );
});
