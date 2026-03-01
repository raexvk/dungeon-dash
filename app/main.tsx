import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainMenu } from './components/MainMenu';
import { SoloGame } from './components/SoloGame';
import { Lobby } from './components/Lobby';
import { MultiplayerGame } from './components/MultiplayerGame';
import './global.css';

function LobbyPage() {
  const roomCode = window.location.pathname.split('/')[2] || '';
  return <Lobby roomCode={roomCode} />;
}

function GamePage() {
  const roomCode = window.location.pathname.split('/')[2] || '';
  return <MultiplayerGame roomCode={roomCode} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/solo" element={<SoloGame />} />
        <Route path="/lobby/:roomCode" element={<LobbyPage />} />
        <Route path="/game/:roomCode" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
