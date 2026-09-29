import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { PartidaProvider } from './contexts/PartidaContext';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <PartidaProvider>
            <App />
          </PartidaProvider>
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
