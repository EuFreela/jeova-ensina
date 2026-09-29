import { io } from 'socket.io-client';
import { tokenStore } from './api';

let socket = null;

/**
 * Conexao unica com o servidor de tempo real.
 * O token de autenticacao viaja no handshake; o proprio servidor valida
 * o JWT antes de aceitar qualquer evento de sessao.
 */
export function criarSocket() {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
    auth: { token: tokenStore.get() },
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function encerrarSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
