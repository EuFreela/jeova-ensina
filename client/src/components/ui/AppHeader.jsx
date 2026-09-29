import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Avatar from './Avatar';
import BrandLogo from './BrandLogo';
import { COM_VOLTAR, destinosDe, destinoAtivo, ehRotaDePartida, tituloDe } from './navegacao';

export default function AppHeader({ aoVoltar }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const destinos = destinosDe(isAdmin);

  const voltar = aoVoltar || (() => navigate(-1));
  const mostrarVoltar = COM_VOLTAR.has(pathname) || ehRotaDePartida(pathname);
  const titulo = tituloDe(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur safe-top">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
        {mostrarVoltar ? (
          <button
            type="button"
            onClick={voltar}
            aria-label="Voltar"
            className="grid size-10 shrink-0 place-items-center rounded-field text-secondary transition-colors hover:bg-primary-light hover:text-primary"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        ) : null}

        <div className="min-w-0 flex-1">
          {titulo && mostrarVoltar ? (
            <h1 className="truncate font-display text-lg font-semibold text-primary-dark">
              {titulo}
            </h1>
          ) : (
            <Link to="/inicio" aria-label="Jeová Ensina - início">
              <BrandLogo tamanho="sm" />
            </Link>
          )}
        </div>

        {/* Navegacao horizontal no desktop: nao ocupa espaco excessivo */}
        <nav aria-label="Navegação principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {destinos.map(({ para, rotulo, Icone }) => {
              const ativo = destinoAtivo(pathname, para);
              return (
                <li key={para}>
                  <Link
                    to={para}
                    aria-current={ativo ? 'page' : undefined}
                    className={[
                      'flex min-h-10 items-center gap-2 rounded-field px-3 text-sm font-medium transition-colors',
                      ativo
                        ? 'bg-primary-light text-primary'
                        : 'text-secondary hover:bg-background hover:text-text',
                    ].join(' ')}
                  >
                    <Icone size={17} aria-hidden="true" />
                    {rotulo}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {user && (
          <Link
            to="/perfil"
            aria-label={`Perfil de ${user.username}`}
            className="shrink-0 rounded-full transition-opacity hover:opacity-80"
          >
            <Avatar nome={user.username} tamanho="md" />
          </Link>
        )}
      </div>
    </header>
  );
}
