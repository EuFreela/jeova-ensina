const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GerenciadorSessoes = require('./sessoes');
const { salaDe } = require('./sessoes');
const { origemLiberada } = require('../config/origens');

const SALA_PRESENCA = 'presenca';
const SALA_DE = (codigo) => `sessao:${codigo}`;

/**
 * Le um booleano de um payload de socket sem a armadilha do Boolean().
 * `Boolean("false")` e `true`, entao um cliente que serializou a flag
 * errado reiniciaria uma partida em andamento so com isso. Aqui so
 * `true` e aceito como verdadeiro; o resto e falso.
 */
function flag(valor) {
  return valor === true;
}

/**
 * Camada em tempo real das sessoes de jogo.
 * Autentica por JWT e mantem a presenca de quem esta online.
 */
function criarRealtime(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => cb(null, origemLiberada(origin)),
      credentials: true,
    },
  });

  const sessoes = new GerenciadorSessoes(io);
  // userId -> { userId, username }. Nao guarda socketId: com varias abas
  // abertas o valor era sobrescrito a cada conexao e nunca era lido.
  // Quem tem mais de uma aba e controlado por `socketsPorUsuario`.
  const online = new Map();
  // Um usuario pode ter mais de uma aba aberta.
  const socketsPorUsuario = new Map(); // userId -> Set<socketId>

  const registrarSocket = (userId, socketId) => {
    if (!socketsPorUsuario.has(userId)) socketsPorUsuario.set(userId, new Set());
    socketsPorUsuario.get(userId).add(socketId);
  };

  const removerSocket = (userId, socketId) => {
    const set = socketsPorUsuario.get(userId);
    if (!set) return;
    set.delete(socketId);
    if (set.size === 0) socketsPorUsuario.delete(userId);
  };

  /** Envia um evento para todas as abas abertas de um usuario. */
  const notificarUsuario = (userId, evento, dados) => {
    const set = socketsPorUsuario.get(userId);
    if (set && set.size) io.to([...set]).emit(evento, dados);
  };

  const listarOnline = () =>
    Array.from(online.values()).map((u) => ({
      userId: u.userId,
      username: u.username,
      sessaoCodigo: sessoes.doUsuario(u.userId)?.codigo || null,
    }));

  const transmitirPresenca = () => {
    io.to(SALA_PRESENCA).emit('presenca:atualizada', { online: listarOnline() });
  };

  const publicarEstado = (sessao) => {
    if (!sessao) return null;
    const payload = sessoes.estadoInicial(sessao);
    io.to(SALA_DE(sessao.codigo)).emit('sessao:estado', payload);
    transmitirPresenca();
    return payload;
  };

  // ---------- autenticacao ----------

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token não fornecido'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (!user) return next(new Error('Usuário não encontrado'));
      socket.data.user = { id: user.id, username: user.username, role: user.role };
      return next();
    } catch {
      return next(new Error('Sessão inválida ou expirada'));
    }
  });

  // ---------- eventos ----------

  io.on('connection', (socket) => {
    const user = socket.data.user;
    online.set(user.id, { userId: user.id, username: user.username });
    registrarSocket(user.id, socket.id);
    socket.join(SALA_PRESENCA);
    transmitirPresenca();

    // Reconecta quem ja estava numa sessao (elenco continua travado).
    // A conexao voltou, entao o jogador deixa de estar "abandonado" e volta
    // a valer para a competicao.
    const retomada = sessoes.doUsuario(user.id);
    if (retomada) {
      sessoes.marcarAbandono(user.id, false);
      socket.join(SALA_DE(retomada.codigo));
      socket.emit('sessao:estado', sessoes.estadoInicial(retomada));
    }
    socket.emit('presenca:atualizada', { online: listarOnline() });

    /**
     * Envolve um handler para responder por acknowledgement.
     * Aguarda handlers assincronos (iniciar/criar consultam o banco) e
     * converte qualquer erro em resposta, em vez de promessa rejeitada.
     */
    const tratar = (handler) => async (payload, ack) => {
      const responder = typeof ack === 'function' ? ack : () => {};
      try {
        const dados = (await handler(payload || {})) || {};
        responder({ ok: true, ...dados });
      } catch (e) {
        responder({ ok: false, erro: e.message, codigo: e.codigo || 400 });
        socket.emit('erro', { mensagem: e.message, codigo: e.codigo || 400 });
      }
    };

    socket.on(
      'presenca:listar',
      tratar(() => ({ online: listarOnline() }))
    );

    socket.on(
      'sessao:listar',
      tratar(() => {
        const minha = sessoes.doUsuario(user.id);
        return {
          sessao: minha ? sessoes.serializar(minha) : null,
          online: listarOnline(),
        };
      })
    );

    socket.on(
      'sessao:consultar',
      tratar(({ codigo }) => {
        const sessao = sessoes.exigir(codigo);
        // Quem consultou e o mesmo jogador que "saiu" recebe sessao: null.
        // Sem isso o card do Inicio voltaria a aparecer, porque o estado
        // devolvido ainda traria a sessao que ele deixou.
        if (!sessao.jogadores.some((j) => j.userId === user.id)) {
          return { estado: { sessao: null, pergunta: null } };
        }
        return { estado: sessoes.estadoInicial(sessao) };
      })
    );

    socket.on(
      'sessao:criar',
      tratar(async (config) => {
        // Um jogador so participa de uma sessao por vez. Sessao encerrada
        // ja cumpriu o papel: pode ser abandonada para criar outra.
        const anterior = sessoes.doUsuario(user.id);
        if (anterior) {
          if (anterior.status !== 'encerrada') {
            throw new Error(
              `Você já está na sessão ${anterior.codigo}. Saia dela antes de criar outra.`
            );
          }
          // Sai do ROOM antigo antes de publicar: o `sair` do gerenciador
          // cuida do elenco, mas nao das salas do socket. Sem este leave o
          // jogador continuaria recebendo os eventos da sessao que deixou.
          socket.leave(SALA_DE(anterior.codigo));
          sessoes.sair(anterior, user.id);
        }

        const sessao = sessoes.criar(user, config);
        socket.join(SALA_DE(sessao.codigo));
        const estado = publicarEstado(sessao);
        return { estado };
      })
    );

    socket.on(
      'sessao:entrar',
      tratar(({ codigo }) => {
        const sessao = sessoes.exigir(codigo);
        sessoes.entrar(sessao, user);
        socket.join(SALA_DE(sessao.codigo));
        const estado = publicarEstado(sessao);
        return { estado };
      })
    );

    socket.on(
      'sessao:adicionar',
      tratar(async ({ codigo, userId, reiniciar }) => {
        const sessao = sessoes.exigir(codigo);
        const alvo = await User.findByPk(userId);
        if (!alvo) throw new Error('Usuário não encontrado');

        sessoes.adicionar(sessao, user.id, alvo, { reiniciar: flag(reiniciar) });
        const estado = publicarEstado(sessao);
        return { estado };
      })
    );

    socket.on(
      'sessao:convidar',
      tratar(async ({ codigo, userId, reiniciar }) => {
        const sessao = sessoes.exigir(codigo);
        const alvo = await User.findByPk(userId);
        if (!alvo) throw new Error('Usuário não encontrado');

        if (sessao.jogadores.some((j) => j.userId === alvo.id)) {
          return { estado: publicarEstado(sessao), convidado: alvo.username };
        }

        sessoes.convidar(sessao, user.id, alvo, { reiniciar: flag(reiniciar) });

        // O convidado so entra no elenco depois de responder "sim".
        notificarUsuario(alvo.id, 'convite:recebido', {
          codigo: sessao.codigo,
          deQuem: user.username,
          total: sessao.perguntas.length,
        });

        return { estado: publicarEstado(sessao), convidado: alvo.username };
      })
    );

    socket.on(
      'sessao:responder_convite',
      tratar(async ({ codigo, aceitar }) => {
        const sessao = sessoes.exigir(codigo);
        const { entrou } = sessoes.responderConvite(sessao, user, flag(aceitar));

        if (entrou) socket.join(SALA_DE(sessao.codigo));
        const estado = publicarEstado(sessao);

        notificarUsuario(sessao.anfitriao, 'convite:resultado', {
          codigo: sessao.codigo,
          username: user.username,
          entrou,
        });

        return { estado, entrou };
      })
    );

    socket.on(
      'sessao:remover',
      tratar(({ codigo, userId }) => {
        const sessao = sessoes.exigir(codigo);
        const alvo = sessao.jogadores.find((j) => j.userId === Number(userId));
        if (!alvo) throw new Error('Este jogador não está na sessão.');

        sessoes.remover(sessao, user.id, alvo.userId);

        // Tira o removido da sala e avisa todas as abas dele.
        const set = socketsPorUsuario.get(alvo.userId);
        if (set && set.size) {
          io.to([...set]).socketsLeave(SALA_DE(sessao.codigo));
          io.to([...set]).emit('sessao:removido', {
            codigo: sessao.codigo,
            porQuem: user.username,
          });
        }

        const estado = publicarEstado(sessao);
        return { estado, removido: alvo.username };
      })
    );

    socket.on(
      'sessao:reiniciar',
      tratar(({ codigo }) => {
        const sessao = sessoes.exigir(codigo);
        sessoes.reiniciar(sessao, user.id);
        const estado = publicarEstado(sessao);
        return { estado };
      })
    );

    socket.on(
      'sessao:iniciar',
      tratar(async ({ codigo }) => {
        const sessao = sessoes.exigir(codigo);
        await sessoes.iniciar(sessao, user.id);
        const estado = publicarEstado(sessao);
        return { estado };
      })
    );

    socket.on(
      'partida:responder',
      tratar(({ codigo, resposta }) => {
        const sessao = sessoes.exigir(codigo);
        sessoes.responder(sessao, user.id, resposta);
        return {};
      })
    );

    socket.on(
      'sessao:sair',
      tratar(({ codigo }) => {
        const sessao = sessoes.obter(codigo);
        if (!sessao) return { saiu: true };
        // Sai da sala ANTES de publicar, senao o jogador que acabou de sair
        // receberia o estado da sessao que ele proprio deixou.
        socket.leave(salaDe(sessao.codigo));
        const restantes = sessoes.sair(sessao, user.id);
        if (restantes) publicarEstado(restantes);
        else transmitirPresenca();
        return { saiu: true, estado: { sessao: null } };
      })
    );

    socket.on('disconnect', () => {
      removerSocket(user.id, socket.id);

      // So encerra a presenca quando nao resta nenhuma aba aberta.
      if (!socketsPorUsuario.has(user.id)) {
        online.delete(user.id);

        // Conexao caiu no meio da partida: o slot fica no elenco (para
        // reconectar), mas o resultado nao entra no historico. So e
        // computadorizado quem atravessa a sessao ate a ultima pergunta.
        const sessaoDoJogador = sessoes.marcarAbandono(user.id, true);
        if (sessaoDoJogador) {
          io.to(SALA_DE(sessaoDoJogador.codigo)).emit('sessao:aviso', {
            mensagem: `${user.username} ficou offline. O resultado desta partida não contará se não voltar.`,
          });
        }
      }

      // O jogador continua no elenco da sessao (elenco travado) e volta ao
      // reconectar; a sessao so e destruida quando ninguem dela esta online.
      for (const sessao of sessoes.sessoes.values()) {
        const temAlguemOnline = sessao.jogadores.some((j) => online.has(j.userId));
        if (!temAlguemOnline) sessoes.destruir(sessao);
      }

      // Uma unica transmissao no fim: antes este bloco emitia duas vezes
      // (uma ao remover a presenca, outra no fim), com a mesma lista.
      transmitirPresenca();
    });
  });

  return { io, sessoes };
}

module.exports = criarRealtime;
