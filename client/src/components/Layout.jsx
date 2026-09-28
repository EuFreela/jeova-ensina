import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const titulos = {
  '/menu': 'Menu Principal',
  '/quiz': 'Quiz',
  '/ranking': 'Ranking Global',
};

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const podeVoltar = pathname !== '/menu' && pathname !== '/';
  const titulo = titulos[pathname] || 'Adivinhação Bíblica';

  function sair() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-fundo/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {podeVoltar ? (
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Voltar"
                className="grid size-9 shrink-0 place-items-center rounded-lg text-texto-suave transition-colors hover:bg-white/10 hover:text-texto"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <span aria-hidden="true" className="text-xl">
                ✝
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold text-texto sm:text-lg">
                {titulo}
              </p>
              {user && <p className="truncate text-xs text-texto-suave">{user.username}</p>}
            </div>
          </div>

          {user && (
            <button
              type="button"
              onClick={sair}
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-texto-suave transition-colors hover:bg-white/10 hover:text-texto"
            >
              Sair
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 safe-bottom">{children}</main>

      <footer className="border-t border-white/10 px-4 py-4 text-center text-xs text-texto-suave/70">
        {podeVoltar ? (
          <Link to="/menu" className="transition-colors hover:text-primaria">
            Voltar ao menu
          </Link>
        ) : (
          <span>"Lâmpada para os meus pés é a tua palavra." — Salmos 119:105</span>
        )}
      </footer>
    </div>
  );
}
