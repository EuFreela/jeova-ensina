import { House, Play, ChartColumn, ShieldCheck } from 'lucide-react';

/**
 * Destinos da navegacao principal (layout.md secao 3.2).
 * "Meu Perfil" nao entra aqui: o avatar do cabecalho ja leva para ele.
 */
export const DESTINOS = [
  { para: '/inicio', rotulo: 'Início', Icone: House },
  { para: '/categorias', rotulo: 'Jogar', Icone: Play },
  { para: '/ranking', rotulo: 'Ranking', Icone: ChartColumn },
];

/** Destino exclusivo para administradores (RBAC). */
export const DESTINO_ADMIN = { para: '/admin', rotulo: 'Admin', Icone: ShieldCheck };

/** Retorna os destinos visiveis conforme o perfil do usuario. */
export function destinosDe(isAdmin) {
  return isAdmin ? [...DESTINOS, DESTINO_ADMIN] : DESTINOS;
}

/** Rotulos das telas, usado pelo cabecalho. */
export const TITULOS = {
  '/inicio': 'Início',
  '/categorias': 'Escolher Categoria',
  '/partidas': 'Jogar com Amigos',
  '/quiz': 'Novo Jogo',
  '/resultado': 'Resultado',
  '/ranking': 'Ranking',
  '/perfil': 'Meu Perfil',
  '/admin': 'Área Administrativa',
  '/trocar-senha': 'Trocar Senha',
};

/** Telas que exibem o botao de voltar. */
export const COM_VOLTAR = new Set([
  '/categorias',
  '/partidas',
  '/quiz',
  '/resultado',
  '/ranking',
  '/perfil',
  '/admin',
]);

/**
 * Titulo da tela atual. As rotas com parametro (ex.: /partida/ABC123)
 * sao resolvidas pelo prefixo, para o cabecalho nunca ficar sem titulo.
 */
export function tituloDe(pathname) {
  if (TITULOS[pathname]) return TITULOS[pathname];
  if (pathname.startsWith('/partida/')) return 'Sessão';
  return null;
}

/** Verdadeiro quando a rota atual e uma sessao de jogo (/partida/:codigo). */
export function ehRotaDePartida(pathname) {
  return pathname.startsWith('/partida/');
}

/**
 * Considera "Jogar" ativo tambem durante a partida, o resultado e as
 * sessoes com amigos, para que o usuario nao perca o destaque do
 * destino atual.
 */
export function destinoAtivo(pathname, para) {
  if (para !== '/categorias') return pathname === para;
  return ['/categorias', '/quiz', '/resultado', '/partidas'].includes(pathname) ||
    pathname.startsWith('/partida/');
}
