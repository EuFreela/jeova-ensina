import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import api, { extrairErro, tokenStore } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const aplicarSessao = useCallback(({ token, user: usuario }) => {
    tokenStore.set(token);
    setUser(usuario);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function restaurarSessao() {
      if (!tokenStore.get()) {
        setCarregando(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        if (!cancelado) setUser(data.user);
      } catch {
        if (!cancelado) tokenStore.clear();
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    restaurarSessao();
    return () => {
      cancelado = true;
    };
  }, []);

  const login = useCallback(
    async (username, password) => {
      const { data } = await api.post('/auth/login', { username, password });
      aplicarSessao(data);
      return data.user;
    },
    [aplicarSessao]
  );

  const alterarSenha = useCallback(async (senhaAtual, novaSenha) => {
    const { data } = await api.post('/auth/change-password', { senhaAtual, novaSenha });
    if (data.token) tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  // O jogador decide se o ranking solo dele fica visivel para os outros.
  // O retorno otimista deixa o botao responder na hora, e a resposta do
  // servidor desfaz caso algo tenha sido barrado.
  const definirRankingPublico = useCallback(async (novoValor) => {
    const anterior = user;
    setUser((atual) => (atual ? { ...atual, ranking_publico: novoValor } : atual));
    try {
      const { data } = await api.put('/auth/ranking-visibilidade', { publico: novoValor });
      setUser(data.usuario);
      return data.usuario;
    } catch (error) {
      setUser(anterior);
      throw new Error(extrairErro(error, 'Não foi possível alterar a visibilidade.'));
    }
  }, [user]);

  const atualizarPerfil = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw new Error(extrairErro(error, 'Não foi possível atualizar seus dados.'));
    }
  }, []);

  const valor = useMemo(
    () => ({
      user,
      carregando,
      autenticado: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      logout,
      alterarSenha,
      definirRankingPublico,
      atualizarPerfil,
    }),
    [
      user,
      carregando,
      login,
      logout,
      alterarSenha,
      definirRankingPublico,
      atualizarPerfil,
    ]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
