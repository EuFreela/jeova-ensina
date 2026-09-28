import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Menu from './pages/Menu';
import Quiz from './pages/Quiz';
import Resultado from './pages/Resultado';
import Ranking from './pages/Ranking';
import { useAuth } from './hooks/useAuth';

function Carregando() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <span
        aria-hidden="true"
        className="size-10 animate-spin rounded-full border-3 border-primaria border-t-transparent"
      />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

function RotaPrivada({ children }) {
  const { autenticado, carregando } = useAuth();
  const location = useLocation();

  if (carregando) return <Carregando />;
  if (!autenticado) return <Navigate to="/login" replace state={{ de: location.pathname }} />;
  return <Layout>{children}</Layout>;
}

function RotaPublica({ children }) {
  const { autenticado, carregando } = useAuth();
  if (carregando) return <Carregando />;
  if (autenticado) return <Navigate to="/menu" replace />;
  return children;
}

export default function App() {
  return (
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
        path="/cadastro"
        element={
          <RotaPublica>
            <Cadastro />
          </RotaPublica>
        }
      />

      <Route
        path="/menu"
        element={
          <RotaPrivada>
            <Menu />
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

      <Route path="*" element={<Navigate to="/menu" replace />} />
    </Routes>
  );
}
