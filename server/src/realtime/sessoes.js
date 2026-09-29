const crypto = require('crypto');
const Pergunta = require('../models/Pergunta');
const Pontuacao = require('../models/Pontuacao');
const { prepararPerguntas } = require('../utils/shuffle');
const { calcularPontuacao } = require('../utils/scoring');
const { normalizar } = require('../utils/texto');

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TOTAL_PADRAO = 10;
const TOTAL_MAXIMO = 30;
const TEMPO_PADRAO = 30;
const TEMPO_MINIMO = 5;
const TEMPO_MAXIMO = 120;
const REVELACAO_MS = 2500;
// Um convite que nao responde em 90s deixa de valer: o alvo pode ter
// fechado o app, e o anfitriao nao pode ficar preso esperando confirmacao.
const EXPIRA_CONVITE_MS = 90 * 1000;

class ErroSessao extends Error {
  constructor(mensagem, codigo = 400) {
    super(mensagem);
    this.codigo = codigo;
  }
}

function gerarCodigo(tamanho = 6) {
  const bytes = crypto.randomBytes(tamanho);
  let codigo = '';
  for (let i = 0; i < tamanho; i += 1) codigo += ALFABETO[bytes[i] % ALFABETO.length];
  return codigo;
}

function salaDe(codigo) {
  return `sessao:${codigo}`;
}

/**
 * Gerencia as sessoes de jogo ao vivo.
 *
 * Regras centrais:
 * - cada jogador participa de APENAS uma sessao por vez;
 * - uma sessao aceita novos jogadores SOMENTE enquanto esta "aguardando";
 * - ao iniciar, o elenco fica TRAVADO: ninguem entra no meio da partida;
 * - para adicionar alguem depois, a sessao precisa ser reiniciada.
 */
class GerenciadorSessoes {
  constructor(io) {
    this.io = io;
    this.sessoes = new Map();
    // codigoDaSessao -> Map<userId, { userId, username, enviadoEm, timer }>
    // Convites aguardando resposta. Nao entram no elenco antes do "sim".
    this.convites = new Map();
  }

  // ---------- ciclo de vida ----------

  obter(codigo) {
    return this.sessoes.get(String(codigo || '').trim().toUpperCase()) || null;
  }

  exigir(codigo) {
    const sessao = this.obter(codigo);
    if (!sessao) throw new ErroSessao('Sessão não encontrada.', 404);
    return sessao;
  }

  doUsuario(userId) {
    for (const sessao of this.sessoes.values()) {
      if (sessao.jogadores.some((j) => j.userId === userId)) return sessao;
    }
    return null;
  }

  gerarCodigoUnico() {
    let codigo = gerarCodigo();
    while (this.sessoes.has(codigo)) codigo = gerarCodigo();
    return codigo;
  }

  novoJogador(user) {
    return {
      userId: user.id,
      username: user.username,
      pontos: 0,
      acertos: 0,
      bonusTotal: 0,
      comboMaximo: 0,
      respondeu: false,
      respostas: [],
      // Conexao caiu no meio da partida: o jogador continua no elenco para
      // reconectar, mas nao pontua no historico de competicao.
      abandonou: false,
    };
  }

  /**
   * Marca (ou desmarca) um jogador como tendo abandonado a partida.
   * Usado quando o socket fecha: o slot e preservado para o reconectar,
   * mas o resultado nao entra no ranking.
   */
  marcarAbandono(userId, valor) {
    const sessao = this.doUsuario(userId);
    const jogador = sessao?.jogadores.find((j) => j.userId === userId);
    if (jogador) jogador.abandonou = Boolean(valor);
    return sessao || null;
  }

  normalizarConfig(config = {}) {
    const total = Number(config.total);
    const tempo = Number(config.tempoPorQuestao);
    return {
      total: Math.min(Math.max(Number.isInteger(total) ? total : TOTAL_PADRAO, 1), TOTAL_MAXIMO),
      categoria: config.categoria || 'todas',
      dificuldade: config.dificuldade || 'todas',
      // Sessao ao vivo sempre tem cronometro, senao a partida travaria.
      tempoPorQuestao: Math.min(
        Math.max(Number.isFinite(tempo) ? tempo : TEMPO_PADRAO, TEMPO_MINIMO),
        TEMPO_MAXIMO
      ),
    };
  }

  criar(user, config = {}) {
    const sessao = {
      codigo: this.gerarCodigoUnico(),
      anfitriao: user.id,
      criadoEm: Date.now(),
      config: this.normalizarConfig(config),
      status: 'aguardando',
      // Definido no inicio: 'solo' com um jogador, 'campeonato' com dois ou mais.
      modo: null,
      persistida: false,
      jogadores: [this.novoJogador(user)],
      perguntas: [],
      indice: 0,
      deadline: null,
      timer: null,
      timerRevelacao: null,
    };
    this.sessoes.set(sessao.codigo, sessao);
    return sessao;
  }

  // ---------- elenco ----------

  entrar(sessao, user) {
    if (sessao.jogadores.some((j) => j.userId === user.id)) return sessao;

    if (sessao.status === 'jogando') {
      throw new ErroSessao(
        'Esta sessão já começou e o elenco está travado. Crie sua própria sessão para jogar.',
        409
      );
    }

    const outra = this.doUsuario(user.id);
    if (outra && outra.codigo !== sessao.codigo) {
      throw new ErroSessao(`Você já está na sessão ${outra.codigo}. Saia dela antes.`, 409);
    }

    sessao.jogadores.push(this.novoJogador(user));
    return sessao;
  }

  adicionar(sessao, anfitriaoId, user, { reiniciar = false } = {}) {
    if (sessao.anfitriao !== anfitriaoId) {
      throw new ErroSessao('Somente o anfitrião pode adicionar jogadores.', 403);
    }
    if (sessao.jogadores.some((j) => j.userId === user.id)) return sessao;

    // Elenco travado: para incluir alguem a sessao precisa ser reiniciada.
    if (sessao.status === 'jogando') {
      if (!reiniciar) {
        throw new ErroSessao(
          'A sessão já começou. Reinicie a sessão para adicionar este jogador.',
          409
        );
      }
      this.reiniciar(sessao, anfitriaoId);
    }

    // Sessao ja encerrada: reiniciar e o caminho natural para jogar de novo.
    if (sessao.status === 'encerrada') {
      this.reiniciar(sessao, anfitriaoId);
    }

    const outra = this.doUsuario(user.id);
    if (outra) {
      throw new ErroSessao(`${user.username} já está em outra sessão.`, 409);
    }

    sessao.jogadores.push(this.novoJogador(user));
    return sessao;
  }

  sair(sessao, userId) {
    const indice = sessao.jogadores.findIndex((j) => j.userId === userId);
    if (indice === -1) return sessao;

    sessao.jogadores.splice(indice, 1);

    if (!sessao.jogadores.length) {
      this.destruir(sessao);
      return null;
    }
    if (sessao.anfitriao === userId) {
      sessao.anfitriao = sessao.jogadores[0].userId;
    }
    if (sessao.status === 'jogando' && sessao.jogadores.every((j) => j.respondeu)) {
      this.revelar(sessao);
    }
    return sessao;
  }

  /** Remove um jogador da sessao. Apenas o anfitriao pode fazer isso. */
  remover(sessao, anfitriaoId, alvoId) {
    if (sessao.anfitriao !== anfitriaoId) {
      throw new ErroSessao('Somente o anfitrião pode remover jogadores.', 403);
    }
    if (alvoId === anfitriaoId) {
      throw new ErroSessao('Você não pode remover a si mesmo. Use "Sair da sessão".', 400);
    }
    const indice = sessao.jogadores.findIndex((j) => j.userId === alvoId);
    if (indice === -1) {
      throw new ErroSessao('Este jogador não está na sessão.', 404);
    }

    sessao.jogadores.splice(indice, 1);

    // Se sobrou alguem, o anfitriao continua (ou a vez passa para o proximo).
    if (sessao.anfitriao === alvoId) {
      sessao.anfitriao = sessao.jogadores[0].userId;
    }
    if (sessao.status === 'jogando' && sessao.jogadores.every((j) => j.respondeu)) {
      this.revelar(sessao);
    }
    return sessao;
  }

  // ---------- convites ----------

  /** Convites ainda aguardando resposta do alvo. */
  pendentes(sessao) {
    return Array.from(this.convites.get(sessao.codigo)?.values() || [])
      .filter((c) => !c.timer.destroyed)
      .map((c) => ({ userId: c.userId, username: c.username }));
  }

  /**
   * Manda um convite. O jogador so entra no elenco depois de aceitar.
   * O anfitriao recebe o retorno com a lista de quem esta pendente.
   */
  convidar(sessao, anfitriaoId, user, { reiniciar = false } = {}) {
    if (sessao.anfitriao !== anfitriaoId) {
      throw new ErroSessao('Somente o anfitrião pode convidar jogadores.', 403);
    }
    if (sessao.jogadores.some((j) => j.userId === user.id)) return sessao;

    // Elenco travado: convite so faz sentido se a sessao for (re)iniciada.
    if (sessao.status === 'jogando') {
      if (!reiniciar) {
        throw new ErroSessao(
          'A sessão já começou. Reinicie a sessão para convidar este jogador.',
          409
        );
      }
      this.reiniciar(sessao, anfitriaoId);
    }
    if (sessao.status === 'encerrada') this.reiniciar(sessao, anfitriaoId);

    const outra = this.doUsuario(user.id);
    if (outra) {
      throw new ErroSessao(`${user.username} já está em outra sessão.`, 409);
    }

    if (!this.convites.has(sessao.codigo)) this.convites.set(sessao.codigo, new Map());
    const doConvite = this.convites.get(sessao.codigo);
    const anterior = doConvite.get(user.id);
    if (anterior) clearTimeout(anterior.timer);

    const convite = { userId: user.id, username: user.username, enviadoEm: Date.now() };
    // Expira sozinho para o anfitriao nao ficar preso esperando resposta.
    convite.timer = setTimeout(() => {
      const perdido = this.expirarConvite(sessao, user.id);
      if (perdido) {
        this.io.to(salaDe(sessao.codigo)).emit('convite:expirado', {
          codigo: sessao.codigo,
          username: user.username,
        });
      }
    }, EXPIRA_CONVITE_MS);
    doConvite.set(user.id, convite);
    return sessao;
  }

  expirarConvite(sessao, userId) {
    const doConvite = this.convites.get(sessao.codigo);
    const convite = doConvite?.get(userId);
    if (!convite) return null;
    clearTimeout(convite.timer);
    doConvite.delete(userId);
    if (!doConvite.size) this.convites.delete(sessao.codigo);
    return convite;
  }

  /**
   * Resposta do convidado. Aceitando, o jogador entra no elenco agora;
   * recusando, sai apenas da lista de pendentes.
   */
  responderConvite(sessao, user, aceitar) {
    this.expirarConvite(sessao, user.id);

    if (!aceitar) {
      return { sessao, entrou: false };
    }
    if (sessao.jogadores.some((j) => j.userId === user.id)) {
      return { sessao, entrou: true };
    }

    const outra = this.doUsuario(user.id);
    if (outra) {
      throw new ErroSessao('Você já está em outra sessão.', 409);
    }

    sessao.jogadores.push(this.novoJogador(user));
    // Mesma regra do inicio: 1 jogador = solo, 2+ = campeonato.
    if (sessao.jogadores.length > 1) sessao.modo = 'campeonato';
    return { sessao, entrou: true };
  }

  destruirConvites(sessao) {
    const doConvite = this.convites.get(sessao.codigo);
    if (!doConvite) return;
    for (const convite of doConvite.values()) clearTimeout(convite.timer);
    this.convites.delete(sessao.codigo);
  }

  destruir(sessao) {
    this.pararTimers(sessao);
    this.destruirConvites(sessao);
    this.sessoes.delete(sessao.codigo);
  }

  // ---------- partida ----------

  reiniciar(sessao, userId) {
    if (sessao.anfitriao !== userId) {
      throw new ErroSessao('Somente o anfitrião pode reiniciar a sessão.', 403);
    }
    this.pararTimers(sessao);
    sessao.status = 'aguardando';
    sessao.modo = null;
    sessao.persistida = false;
    sessao.perguntas = [];
    sessao.indice = 0;
    sessao.deadline = null;
    sessao.jogadores.forEach((j) => {
      j.pontos = 0;
      j.acertos = 0;
      j.bonusTotal = 0;
      j.comboMaximo = 0;
      j.respondeu = false;
      j.respostas = [];
    });
    return sessao;
  }

  async carregarPerguntas(config) {
    const where = {};
    if (config.categoria && config.categoria !== 'todas') where.categoria = config.categoria;
    if (config.dificuldade && config.dificuldade !== 'todas') where.dificuldade = config.dificuldade;

    const registros = await Pergunta.findAll({ where });
    if (!registros.length) {
      throw new ErroSessao('Não há perguntas para esse filtro.', 404);
    }

    // Sorteia UMA vez: todos da sessão veem as mesmas perguntas e opcoes.
    const preparadas = prepararPerguntas(registros);
    const total = Math.min(config.total, preparadas.length);
    return preparadas.slice(0, total);
  }

  async iniciar(sessao, userId) {
    if (sessao.anfitriao !== userId) {
      throw new ErroSessao('Somente o anfitrião pode iniciar a partida.', 403);
    }
    if (sessao.status === 'jogando') {
      throw new ErroSessao('A sessão já está em andamento.', 409);
    }
    if (!sessao.jogadores.length) {
      throw new ErroSessao('A sessão está vazia.', 400);
    }

    sessao.perguntas = await this.carregarPerguntas(sessao.config);
    sessao.status = 'jogando';
    sessao.indice = 0;
    sessao.persistida = false;
    // O modo nasce do tamanho do elenco no momento do inicio e nao muda mais:
    // solo nao vira campeonato no meio da partida.
    sessao.modo = sessao.jogadores.length > 1 ? 'campeonato' : 'solo';
    this.irPara(sessao, 0);
    return sessao;
  }

  responder(sessao, userId, resposta) {
    if (sessao.status !== 'jogando') {
      throw new ErroSessao('A sessão não está em andamento.', 409);
    }
    const jogador = sessao.jogadores.find((j) => j.userId === userId);
    if (!jogador) {
      throw new ErroSessao('Você não participa desta sessão.', 403);
    }
    if (jogador.respondeu) return sessao;

    const pergunta = sessao.perguntas[sessao.indice];
    const correta = normalizar(resposta) === normalizar(pergunta.opcoes[pergunta.resposta_correta]);

    jogador.respostas.push({
      perguntaId: pergunta.id,
      correta,
      dificuldade: pergunta.dificuldade,
    });
    const resultado = calcularPontuacao(jogador.respostas);
    jogador.pontos = resultado.pontuacao;
    jogador.acertos = resultado.acertos;
    jogador.bonusTotal = resultado.bonusTotal;
    jogador.comboMaximo = resultado.comboMaximo;
    jogador.respondeu = true;

    this.io.to(salaDe(sessao.codigo)).emit('ranking:atualizado', { placar: this.placar(sessao) });

    if (sessao.jogadores.every((j) => j.respondeu)) this.revelar(sessao);
    return sessao;
  }

  irPara(sessao, indice) {
    sessao.indice = indice;
    const pergunta = sessao.perguntas[indice];
    sessao.jogadores.forEach((j) => {
      j.respondeu = false;
    });

    this.pararTimers(sessao);
    sessao.deadline = Date.now() + sessao.config.tempoPorQuestao * 1000;
    sessao.timer = setTimeout(() => this.avancar(sessao), sessao.config.tempoPorQuestao * 1000);

    this.io.to(salaDe(sessao.codigo)).emit('partida:pergunta', {
      indice,
      total: sessao.perguntas.length,
      pergunta: this.perguntaPublica(pergunta),
      tempoRestante: sessao.config.tempoPorQuestao,
      deadline: sessao.deadline,
      placar: this.placar(sessao),
    });
  }

  revelar(sessao) {
    this.pararTimers(sessao);
    const pergunta = sessao.perguntas[sessao.indice];
    if (!pergunta) return;

    sessao.jogadores.forEach((j) => {
      j.respondeu = false;
    });

    this.io.to(salaDe(sessao.codigo)).emit('partida:revelacao', {
      perguntaId: pergunta.id,
      correta: pergunta.opcoes[pergunta.resposta_correta],
      placar: this.placar(sessao),
    });

    sessao.timerRevelacao = setTimeout(() => this.avancar(sessao), REVELACAO_MS);
  }

  avancar(sessao) {
    this.pararTimers(sessao);
    const proxima = sessao.indice + 1;
    if (proxima >= sessao.perguntas.length) {
      this.encerrar(sessao);
      return;
    }
    this.irPara(sessao, proxima);
  }

  encerrar(sessao) {
    this.pararTimers(sessao);
    sessao.status = 'encerrada';
    sessao.deadline = null;
    this.persistir(sessao);
    this.io.to(salaDe(sessao.codigo)).emit('partida:fim', {
      placar: this.placar(sessao),
      total: sessao.perguntas.length,
      modo: sessao.modo,
    });
  }

  /**
   * Grava o resultado de cada jogador no banco.
   * O modo gravado e o mesmo do inicio da sessao, entao a partida aparece
   * no ranking Solo ou no ranking Campeonato, nunca nos dois.
   *
   * So entra no historico quem cumpriu a sessao INTEIRA:
   * - o jogo precisa ter chegado ate a ultima questao;
   * - o jogador precisa ter respondido todas as perguntas;
   * - quem saiu ou a conexao caiu no meio fica de fora da competicao.
   */
  async persistir(sessao) {
    if (sessao.persistida || !sessao.modo) return;
    sessao.persistida = true;

    const totalQuestoes = sessao.perguntas.length;
    const chegouAoFim = sessao.status === 'encerrada' && sessao.indice + 1 >= totalQuestoes;
    if (!chegouAoFim) {
      console.warn(
        `Sessao ${sessao.codigo} encerrou em ${sessao.indice + 1}/${totalQuestoes} perguntas: nada foi pontuado.`
      );
      return;
    }

    const registros = sessao.jogadores
      .filter((j) => !j.abandonou && j.respostas.length >= totalQuestoes)
      .map((j) => {
        const resultado = calcularPontuacao(j.respostas);
        return {
          user_id: j.userId,
          pontuacao: resultado.pontuacao,
          acertos: resultado.acertos,
          total_perguntas: resultado.total_perguntas,
          modo: sessao.modo,
        };
      });

    if (!registros.length) return;

    try {
      await Pontuacao.bulkCreate(registros);
    } catch (e) {
      sessao.persistida = false;
      console.error('Falha ao salvar pontuacoes da sessao:', e.message);
    }
  }

  pararTimers(sessao) {
    if (sessao.timer) {
      clearTimeout(sessao.timer);
      sessao.timer = null;
    }
    if (sessao.timerRevelacao) {
      clearTimeout(sessao.timerRevelacao);
      sessao.timerRevelacao = null;
    }
  }

  // ---------- serializacao ----------

  /** Remove o gabarito: o cliente nunca recebe a resposta correta. */
  perguntaPublica(pergunta) {
    if (!pergunta) return null;
    return {
      id: pergunta.id,
      pergunta: pergunta.pergunta,
      opcoes: pergunta.opcoes,
      categoria: pergunta.categoria,
      dificuldade: pergunta.dificuldade,
      referencia: pergunta.referencia,
    };
  }

  placar(sessao) {
    return [...sessao.jogadores]
      .sort(
        (a, b) =>
          b.pontos - a.pontos || b.acertos - a.acertos || a.username.localeCompare(b.username, 'pt-BR')
      )
      .map((j, i) => ({
        posicao: i + 1,
        userId: j.userId,
        username: j.username,
        pontos: j.pontos,
        acertos: j.acertos,
        respondeu: j.respondeu,
        comboMaximo: j.comboMaximo,
      }));
  }

  serializar(sessao) {
    return {
      codigo: sessao.codigo,
      anfitriao: sessao.anfitriao,
      status: sessao.status,
      modo: sessao.modo,
      config: sessao.config,
      indice: sessao.indice,
      total: sessao.perguntas.length,
      deadline: sessao.deadline,
      jogadores: this.placar(sessao),
      // Quem foi convidado e ainda nao respondeu (entra no elenco so no "sim").
      convites: this.pendentes(sessao),
    };
  }

  estadoInicial(sessao) {
    return {
      sessao: this.serializar(sessao),
      pergunta: this.perguntaPublica(sessao.perguntas[sessao.indice] || null),
    };
  }

  entrarSala(io, socket, sessao) {
    socket.join(salaDe(sessao.codigo));
  }
}

module.exports = GerenciadorSessoes;
module.exports.ErroSessao = ErroSessao;
// O index.js usa o mesmo prefixo para tirar o socket da sala em 'sessao:sair',
// senao o jogador que acabou de sair continua recebendo o estado da sessao.
module.exports.salaDe = salaDe;
