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

  const cadastro = useCallback(
    async (username, password, confirmPassword) => {
      const { data } = await api.post('/auth/register', { username, password, confirmPassword });
      aplicarSessao(data);
      return data.user;
    },
    [aplicarSessao]
  );

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
    () => ({ user, carregando, autenticado: Boolean(user), login, cadastro, logout, atualizarPerfil }),
    [user, carregando, login, cadastro, logout, atualizarPerfil]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
