import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { criarSocket, encerrarSocket } from '../services/socket';
import { useAuth } from '../hooks/useAuth';

const PartidaContext = createContext(null);

/**
 * Estado das sessoes de jogo ao vivo.
 * O servidor e a fonte da verdade: o cliente apenas reflete os eventos.
 */
export function PartidaProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);

  const [conexao, setConexao] = useState('desconectado');
  const [sessao, setSessao] = useState(null);
  const [pergunta, setPergunta] = useState(null);
  const [deadline, setDeadline] = useState(null);
  const [progresso, setProgresso] = useState({ indice: 0, total: 0 });
  const [placar, setPlacar] = useState([]);
  const [revelacao, setRevelacao] = useState(null);
  const [fim, setFim] = useState(null);
  const [online, setOnline] = useState([]);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [removidoDe, setRemovidoDe] = useState(null);
  // Convite chegando do anfitriao: so aparece depois que ele te chama.
  const [convite, setConvite] = useState(null);
  const [resolvendoConvite, setResolvendoConvite] = useState(false);
  const [aviso, setAviso] = useState('');

  const conectar = useCallback(() => {
    if (socketRef.current) return socketRef.current;

    const socket = criarSocket();
    socketRef.current = socket;

    socket.on('connect', () => setConexao('conectado'));
    socket.on('disconnect', () => setConexao('desconectado'));
    socket.on('connect_error', (e) => {
      setConexao('erro');
      setErro(e.message || 'Não foi possível conectar ao servidor de jogo.');
    });

    socket.on('presenca:atualizada', (dados) => setOnline(dados.online || []));
    socket.on('sessao:estado', (dados) => {
      setSessao(dados.sessao);
      setDeadline(dados.sessao?.deadline ?? null);
      setProgresso({ indice: dados.sessao?.indice ?? 0, total: dados.sessao?.total ?? 0 });
      if (dados.pergunta) setPergunta(dados.pergunta);
    });
    socket.on('partida:pergunta', (dados) => {
      setPergunta(dados.pergunta);
      setDeadline(dados.deadline ?? null);
      setProgresso({ indice: dados.indice ?? 0, total: dados.total ?? 0 });
      setPlacar(dados.placar || []);
      setRevelacao(null);
      setFim(null);
    });
    socket.on('ranking:atualizado', (dados) => setPlacar(dados.placar || []));
    socket.on('partida:revelacao', (dados) => {
      setRevelacao({ perguntaId: dados.perguntaId, correta: dados.correta });
      setDeadline(null);
      setPlacar(dados.placar || []);
    });
    socket.on('partida:fim', (dados) => {
      setFim({ placar: dados.placar || [], total: dados.total });
      setDeadline(null);
      setRevelacao(null);
    });
    socket.on('erro', (dados) => setErro(dados.mensagem || 'Ocorreu um erro.'));

    // O anfitriao me chamou para a sessao. Nao entro no elenco sem o "sim".
    socket.on('convite:recebido', (dados) => {
      setConvite({
        codigo: dados.codigo,
        deQuem: dados.deQuem,
        total: dados.total,
      });
    });
    socket.on('convite:resultado', (dados) => {
      setAviso(
        dados.entrou
          ? `${dados.username} aceitou o convite.`
          : `${dados.username} recusou o convite.`
      );
    });
    socket.on('convite:expirado', (dados) => {
      setAviso(`${dados.username} não respondeu o convite a tempo.`);
    });
    socket.on('sessao:aviso', (dados) => setAviso(dados.mensagem || ''));

    // O anfitriao removeu este jogador da sessao: limpa a tela.
    socket.on('sessao:removido', (dados) => {
      setRemovidoDe(dados);
      setSessao(null);
      setPergunta(null);
      setDeadline(null);
      setProgresso({ indice: 0, total: 0 });
      setPlacar([]);
      setRevelacao(null);
      setFim(null);
    });

    return socket;
  }, []);

  const desconectar = useCallback(() => {
    encerrarSocket();
    socketRef.current = null;
    setConexao('desconectado');
    setSessao(null);
    setPergunta(null);
    setDeadline(null);
    setPlacar([]);
    setRevelacao(null);
    setFim(null);
  }, []);

  const emitir = useCallback(
    (evento, payload = {}) =>
      new Promise((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket || !socket.connected) {
          const mensagem = 'Sem conexão com o servidor de jogo.';
          setErro(mensagem);
          reject(new Error(mensagem));
          return;
        }
        socket.emit(evento, payload, (resposta) => {
          if (resposta?.ok) {
            setErro('');
            if (resposta.estado?.sessao) setSessao(resposta.estado.sessao);
            if (resposta.estado?.pergunta !== undefined) setPergunta(resposta.estado.pergunta);
            resolve(resposta);
          } else {
            const mensagem = resposta?.erro || 'Não foi possível concluir a operação.';
            setErro(mensagem);
            reject(new Error(mensagem));
          }
        });
      }),
    []
  );

  const acao = useCallback(
    (evento) => async (payload) => {
      setOcupado(true);
      try {
        return await emitir(evento, payload);
      } catch {
        return null;
      } finally {
        setOcupado(false);
      }
    },
    [emitir]
  );

  const criarSessao = useMemo(
    () => acao('sessao:criar'),
    [acao]
  );
  const entrarSessao = useMemo(() => acao('sessao:entrar'), [acao]);
  const consultarSessao = useMemo(() => acao('sessao:consultar'), [acao]);
  const adicionarJogador = useMemo(() => acao('sessao:adicionar'), [acao]);
  const convidarJogador = useMemo(() => acao('sessao:convidar'), [acao]);

  /** O convidado aceita ou recusa. No "sim" devolve o codigo da sessao. */
  const responderConvite = useCallback(
    async (aceitar) => {
      if (!convite) return null;
      setResolvendoConvite(true);
      try {
        const resposta = await emitir('sessao:responder_convite', {
          codigo: convite.codigo,
          aceitar,
        });
        setConvite(null);
        return resposta.entrou ? convite.codigo : null;
      } catch {
        setConvite(null);
        return null;
      } finally {
        setResolvendoConvite(false);
      }
    },
    [convite, emitir]
  );
  const removerJogador = useMemo(() => acao('sessao:remover'), [acao]);
  const reiniciarSessao = useMemo(() => acao('sessao:reiniciar'), [acao]);
  const iniciarPartida = useMemo(() => acao('sessao:iniciar'), [acao]);
  // Sair precisa limpar o estado local na mao: o servidor responde apenas
  // { saiu: true }, sem o estado da sessao, entao o card do Inicio e a lista
  // de Partidas continuariam apontando para uma sessao que o jogador ja
  // deixou. Confere tambem que a sessao sumiu do estado antes de zerar.
  const sairSessao = useCallback(
    async ({ codigo } = {}) => {
      setOcupado(true);
      try {
        const resposta = await emitir('sessao:sair', { codigo });
        setSessao((atual) => (atual && atual.codigo === codigo ? null : atual));
        setPergunta(null);
        return resposta;
      } finally {
        setOcupado(false);
      }
    },
    [emitir]
  );

  const responder = useCallback(
    async (codigo, resposta) => {
      setOcupado(true);
      try {
        await emitir('partida:responder', { codigo, resposta });
        return true;
      } catch {
        return false;
      } finally {
        setOcupado(false);
      }
    },
    [emitir]
  );

  const atualizarPresenca = useCallback(() => emitir('presenca:listar'), [emitir]);

  // O provider vive acima das rotas, entao e ele que decide abrir e fechar a
  // conexao conforme o login. Antes so abria dentro de Partidas/Partida, o
  // que fazia o jogador demorar (ou nao aparecer) na lista de online.
  // Agora: logou -> conecta e o servidor transmite a presenca na hora;
  // saiu da conta -> desconecta, sumindo da lista e derrubando o socket
  // autenticado que continuaria valendo ate fechar a aba.
  useEffect(() => {
    if (!user) {
      if (socketRef.current) desconectar();
      setOnline([]);
      return;
    }
    conectar();
  }, [user, conectar, desconectar]);

  useEffect(() => () => encerrarSocket(), []);

  const meuId = user?.id;
  const ehAnfitriao = Boolean(sessao && meuId && sessao.anfitriao === meuId);
  const minhaSessao = sessao || null;

  const valor = useMemo(
    () => ({
      conexao,
      sessao: minhaSessao,
      pergunta,
      deadline,
      progresso,
      placar,
      revelacao,
      fim,
      online,
      erro,
      ocupado,
      removidoDe,
      limparRemovido: setRemovidoDe,
      convite,
      convitesPendente: minhaSessao?.convites || [],
      resolvendoConvite,
      aviso,
      setAviso,
      ehAnfitriao,
      meuId,
      setErro,
      conectar,
      desconectar,
      atualizarPresenca,
      criarSessao,
      entrarSessao,
      consultarSessao,
      adicionarJogador,
      convidarJogador,
      responderConvite,
      removerJogador,
      reiniciarSessao,
      iniciarPartida,
      sairSessao,
      responder,
    }),
    [
      conexao,
      minhaSessao,
      pergunta,
      deadline,
      progresso,
      placar,
      revelacao,
      fim,
      online,
      erro,
      ocupado,
      removidoDe,
      convite,
      resolvendoConvite,
      aviso,
      ehAnfitriao,
      meuId,
      conectar,
      desconectar,
      atualizarPresenca,
      criarSessao,
      entrarSessao,
      consultarSessao,
      adicionarJogador,
      convidarJogador,
      responderConvite,
      removerJogador,
      reiniciarSessao,
      iniciarPartida,
      sairSessao,
      responder,
    ]
  );

  return <PartidaContext.Provider value={valor}>{children}</PartidaContext.Provider>;
}

export function usePartida() {
  const contexto = useContext(PartidaContext);
  if (!contexto) {
    throw new Error('usePartida precisa estar dentro de <PartidaProvider>');
  }
  return contexto;
}
