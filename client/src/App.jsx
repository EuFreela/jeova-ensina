import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import AppLayout from './components/AppLayout';
import LoadingState from './components/ui/LoadingState';
import ModalConvite from './components/ui/ModalConvite';
import Login from './pages/Login';
import Inicio from './pages/Inicio';
import Categorias from './pages/Categorias';
import Quiz from './pages/Quiz';
import Resultado from './pages/Resultado';
import Partidas from './pages/Partidas';
import Partida from './pages/Partida';
import Ranking from './pages/Ranking';
import Perfil from './pages/Perfil';
import Admin from './pages/Admin';
import TrocarSenha from './pages/TrocarSenha';
import { useAuth } from './hooks/useAuth';
import { usePartida } from './contexts/PartidaContext';

function Carregando() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <LoadingState mensagem="Carregando..." />
    </div>
  );
}

/**
 * Rotas privadas. Aplica RBAC:
 * - exige autenticacao;
 * - exige troca de senha quando a conta usa senha provisoria;
 * - restringe a area admin a quem tem perfil 'admin'.
 */
function RotaPrivada({ children, somenteAdmin = false }) {
  const { autenticado, carregando, user, isAdmin } = useAuth();
  const location = useLocation();

  if (carregando) return <Carregando />;

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ de: location.pathname }} />;
  }

  if (user?.must_change_password && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />;
  }

  if (somenteAdmin && !isAdmin) {
    return <Navigate to="/inicio" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function RotaPublica({ children }) {
  const { autenticado, carregando, user } = useAuth();
  const location = useLocation();

  if (carregando) return <Carregando />;

  if (autenticado) {
    // Respeita o destino que a rota privada guardou ao expulsar o usuario
    // para o login (ex.: /partida/1234). Sem isso, o <Navigate> do guard
    // sobrescreve o history antes da tela de login conseguir navegar, e
    // quem abriu o link cai no inicio em vez de voltar para a sessao.
    const destino = user?.must_change_password ? '/trocar-senha' : location.state?.de || '/inicio';
    // Carrega o destino para a troca de senha saber para onde ir depois.
    return <Navigate to={destino} replace state={location.state?.de ? { de: location.state.de } : undefined} />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <Routes>
      <Route
        path="/login"
        element={
          <RotaPublica>
            <Login />
          </RotaPublica>
        }
      />

      <Route
        path="/trocar-senha"
        element={
          <RotaPrivada>
            <TrocarSenha />
          </RotaPrivada>
        }
      />
      <Route
        path="/inicio"
        element={
          <RotaPrivada>
            <Inicio />
          </RotaPrivada>
        }
      />
      <Route
        path="/categorias"
        element={
          <RotaPrivada>
            <Categorias />
          </RotaPrivada>
        }
      />
      <Route
        path="/quiz"
        element={
          <RotaPrivada>
            <Quiz />
          </RotaPrivada>
        }
      />
      <Route
        path="/partidas"
        element={
          <RotaPrivada>
            <Partidas />
          </RotaPrivada>
        }
      />
      <Route
        path="/partida/:codigo"
        element={
          <RotaPrivada>
            <Partida />
          </RotaPrivada>
        }
      />
      <Route
        path="/resultado"
        element={
          <RotaPrivada>
            <Resultado />
          </RotaPrivada>
        }
      />
      <Route
        path="/ranking"
        element={
          <RotaPrivada>
            <Ranking />
          </RotaPrivada>
        }
      />
      <Route
        path="/perfil"
        element={
          <RotaPrivada>
            <Perfil />
          </RotaPrivada>
        }
      />
      <Route
        path="/admin"
        element={
          <RotaPrivada somenteAdmin>
            <Admin />
          </RotaPrivada>
        }
      />

      {/* Redirecionamentos: raiz, cadastro removido e rota antiga do menu */}
      <Route path="/" element={<Navigate to="/inicio" replace />} />
      <Route path="/cadastro" element={<Navigate to="/login" replace />} />
      <Route path="/menu" element={<Navigate to="/inicio" replace />} />
      <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>

      <ConvitePartida />
    </>
  );
}

/**
 * Convite de partida. Fica fora das rotas para aparecer em QUALQUER tela:
 * quem esta no inicio quando o anfitriao chama precisa ver o convite.
 * Aceitar leva direto para a sessao; recusar mantem o usuario onde esta.
 */
function ConvitePartida() {
  const navigate = useNavigate();
  const { convite, resolvendoConvite, responderConvite } = usePartida();

  const aoAceitar = useCallback(async () => {
    const codigo = await responderConvite(true);
    if (codigo) navigate(`/partida/${codigo}`);
  }, [responderConvite, navigate]);

  const aoRecusar = useCallback(async () => {
    await responderConvite(false);
  }, [responderConvite]);

  return (
    <ModalConvite
      convite={convite}
      carregando={resolvendoConvite}
      onAceitar={aoAceitar}
      onRecusar={aoRecusar}
    />
  );
}
