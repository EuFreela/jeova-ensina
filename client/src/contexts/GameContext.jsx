import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const GameContext = createContext(null);

const ESTADO_INICIAL = {
  total: 10,
  categoria: 'todas',
  dificuldade: 'todas',
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
    setUltimoResultado(null);
    setErroSalvar(null);
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
