import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const GameContext = createContext(null);

/** Vidas iniciais e tempo padrao, conforme script.md. */
export const VIDAS_INICIAIS = 3;
export const TEMPO_PADRAO = 30;

const ESTADO_INICIAL = {
  total: 10,
  categoria: 'todas',
  dificuldade: 'todas',
  tempoPorQuestao: TEMPO_PADRAO, // 0 desliga o cronometro
  vidas: VIDAS_INICIAIS,
  origem: null,
  partidaId: 0,
  ultimoResultado: null,
  salvando: false,
  erroSalvar: null,
};

export function GameProvider({ children }) {
  const [config, setConfig] = useState(ESTADO_INICIAL);
  const [ultimoResultado, setUltimoResultado] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState(null);

  const iniciarPartida = useCallback((opcoes = {}) => {
    setConfig((anterior) => ({
      ...anterior,
      total: opcoes.total ?? 10,
      categoria: opcoes.categoria ?? 'todas',
      dificuldade: opcoes.dificuldade ?? 'todas',
      tempoPorQuestao: opcoes.tempoPorQuestao ?? TEMPO_PADRAO,
      vidas: opcoes.vidas ?? VIDAS_INICIAIS,
      origem: opcoes.origem ?? null,
      partidaId: anterior.partidaId + 1,
    }));
  }, []);

  const registrarResultado = useCallback((resultado) => {
    setUltimoResultado(resultado);
  }, []);

  const definirSalvamento = useCallback((estado) => {
    setSalvando(estado.carregando);
    setErroSalvar(estado.erro ?? null);
  }, []);

  const reiniciar = useCallback(() => {
    setConfig((anterior) => ({ ...ESTADO_INICIAL, partidaId: anterior.partidaId }));
    setUltimoResultado(null);
    setErroSalvar(null);
    setSalvando(false);
  }, []);

  const valor = useMemo(
    () => ({
      config,
      ultimoResultado,
      salvando,
      erroSalvar,
      iniciarPartida,
      registrarResultado,
      definirSalvamento,
      reiniciar,
    }),
    [config, ultimoResultado, salvando, erroSalvar, iniciarPartida, registrarResultado, definirSalvamento, reiniciar]
  );

  return <GameContext.Provider value={valor}>{children}</GameContext.Provider>;
}

export function useGame() {
  const contexto = useContext(GameContext);
  if (!contexto) {
    throw new Error('useGame precisa estar dentro de <GameProvider>');
  }
  return contexto;
}
