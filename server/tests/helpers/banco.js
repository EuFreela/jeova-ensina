/**
 * Banco de dados isolado para os testes de API.
 *
 * Precisa ser carregado ANTES de qualquer `require('../../src/app')`: tanto
 * `config/database.js` quanto `app.js` chamam `dotenv.config()`, que nao
 * sobrescreve variavel ja definida no ambiente. Por isso este arquivo
 * monta o app inteiro e exporta os handles, e nao o contrario.
 *
 * O banco e `:memory:`: some quando o processo termina e nunca toca no
 * `server/data/database.sqlite` de desenvolvimento.
 */
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.DATABASE_DIALECT = 'sqlite';
process.env.DATABASE_STORAGE = ':memory:';
process.env.JWT_SECRET = 'segredo-de-teste-com-tamanho-suficiente-0123456789';
process.env.CLIENT_URL = 'http://localhost:5173';
delete process.env.TRUST_PROXY;

// Os limiters contam por IP, e num teste todas as requisicoes vem de
// 127.0.0.1: em poucos casos o teto de 20 logins/15min estouraria e o
// proprio teste comecaria a falhar por limite, nao por defeito. Aqui os
// tetos ficam altos de proposito.
process.env.LIMITE_LOGIN = '10000';
process.env.LIMITE_SENHA = '10000';
process.env.LIMITE_ADMIN = '10000';
process.env.LIMITE_PONTUACAO = '10000';
process.env.LIMITE_GERAL = '10000';

const sequelize = require('../../src/config/database');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Pergunta = require('../../src/models/Pergunta');
const Pontuacao = require('../../src/models/Pontuacao');

let iniciado = false;

async function prepararBanco() {
  if (!iniciado) {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    iniciado = true;
  }
  // Zera as tabelas preservando o schema: cada teste parte do zero.
  await Pontuacao.destroy({ where: {}, truncate: true });
  await Pergunta.destroy({ where: {}, truncate: true });
  await User.destroy({ where: {}, truncate: true });
}

async function fecharBanco() {
  await sequelize.close();
}

/** Cria um usuario ja com senha definitiva (sem codigo de 4 digitos). */
async function criarUsuario(over = {}) {
  return User.create({
    username: over.username || 'jogador',
    password: over.password || 'senha1234',
    role: over.role || 'player',
    codigo: null,
    senha_expira_em: null,
    must_change_password: false,
    ranking_publico: over.ranking_publico !== undefined ? over.ranking_publico : true,
  });
}

async function tokenDe(username, senha = 'senha1234') {
  // O contrato da API usa `password` (e nao `senha`) no corpo do login;
  // `senhaAtual`/`novaSenha` sao os nomes da troca de senha.
  const res = await request(app).post('/api/auth/login').send({ username, password: senha });
  return res.body.token;
}

/** Pergunta de 4 opcoes, gabarito na indice 0 ('certa'). */
async function criarPergunta(over = {}) {
  return Pergunta.create({
    pergunta: over.pergunta || 'Quem escreveu o livro de Genesis?',
    opcoes: over.opcoes || ['Moisés', 'Davi', 'Ezequiel', 'Isaías'],
    resposta_correta: over.resposta_correta !== undefined ? over.resposta_correta : 0,
    dificuldade: over.dificuldade || 'facil',
    categoria: over.categoria || 'Pentateuco',
    ativa: over.ativa !== undefined ? over.ativa : true,
  });
}

/** Envolve um handler de controller num req/res falsos que registram a resposta. */
function reqRes(over = {}) {
  const res = {
    statusCode: 200,
    corpo: undefined,
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(payload) {
      this.corpo = payload;
      return this;
    },
  };
  return { req: { body: {}, query: {}, ...over }, res };
}

module.exports = {
  request,
  app,
  sequelize,
  prepararBanco,
  fecharBanco,
  criarUsuario,
  criarPergunta,
  tokenDe,
  reqRes,
  User,
  Pergunta,
  Pontuacao,
};