import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { destinosDe, destinoAtivo } from '../../constants/navegacao';

/** Navegacao inferior fixa no mobile (docs/layout.md secao 3.2). */
export default function BottomNavigation() {
  const { pathname } = useLocation();
  const { isAdmin } = useAuth();

  const destinos = destinosDe(isAdmin);

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur safe-bottom md:hidden"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch">
        {destinos.map(({ para, rotulo, Icone }) => {
          const ativo = destinoAtivo(pathname, para);

          return (
            <li key={para} className="flex-1">
              <NavLink
                to={para}
                aria-current={ativo ? 'page' : undefined}
                className={[
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2',
                  'text-[11px] font-medium transition-colors',
                  ativo ? 'text-primary' : 'text-secondary',
                ].join(' ')}
              >
                {({ isActive }) => (
                  <>
                    <Icone
                      size={21}
                      strokeWidth={ativo || isActive ? 2.4 : 1.9}
                      aria-hidden="true"
                    />
                    <span className={ativo || isActive ? 'font-semibold' : ''}>{rotulo}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
