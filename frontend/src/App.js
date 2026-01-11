import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';
import Home from './components/Home';
import GameLobby from './components/GameLobby';
import GameBoard from './components/GameBoard';
import LiveRegion from './components/LiveRegion';

// Detectar automáticamente la URL del backend
const getBackendURL = () => {
  // Si hay una variable de entorno, úsala
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Si accedemos desde localhost, usar localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // Si accedemos desde otra IP (móvil), usar la misma IP pero puerto 3001
  return `http://${window.location.hostname}:3001`;
};

const API_URL = getBackendURL();
const socket = io(API_URL, {
  transports: ['websocket', 'polling']
});

function App() {
  const [screen, setScreen] = useState('home'); // home, lobby, game
  const [gameData, setGameData] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [announcement, setAnnouncement] = useState('');

  // Función para anunciar mensajes a lectores de pantalla
  const announce = (message) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(''), 100);
  };

  // Crear partida
  const createGame = async (hostName, gameMode) => {
    try {
      const response = await axios.post(`${API_URL}/api/games/create`, {
        hostName,
        gameMode
      });
      
      if (response.data.success) {
        setGameData(response.data.game);
        setPlayerName(hostName);
        setScreen('lobby');
        socket.emit('joinGame', response.data.gameCode);
        announce(`Partida creada con código ${response.data.gameCode}`);
      }
    } catch (error) {
      console.error('Error creando partida:', error);
      announce('Error al crear la partida. Intenta nuevamente.');
    }
  };

  // Unirse a partida
  const joinGame = async (gameCode, playerNameInput) => {
    try {
      const response = await axios.post(`${API_URL}/api/games/join`, {
        gameCode,
        playerName: playerNameInput
      });
      
      if (response.data.success) {
        setGameData(response.data.game);
        setPlayerName(playerNameInput);
        setScreen('lobby');
        socket.emit('joinGame', gameCode);
        announce(`Te has unido a la partida ${gameCode}`);
      }
    } catch (error) {
      console.error('Error uniéndose a partida:', error);
      const message = error.response?.data?.message || 'Error al unirse a la partida';
      announce(message);
      alert(message);
    }
  };

  // Iniciar partida
  const startGame = () => {
    socket.emit('startGame', gameData.code);
    setScreen('game');
    announce('La partida ha comenzado');
  };

  // Escuchar eventos de Socket.io
  useEffect(() => {
    socket.on('playerJoined', (data) => {
      setGameData(prev => ({
        ...prev,
        players: data.players
      }));
      announce(`${data.playerName} se ha unido a la partida`);
    });

    socket.on('gameStarted', (data) => {
      setScreen('game');
      setGameData(data.game);
      announce('La partida ha comenzado');
    });

    socket.on('answerSubmitted', (data) => {
      setGameData(prev => ({
        ...prev,
        players: data.players,
        currentTurn: data.currentTurn,
        turnPlayer: data.turnPlayer
      }));
      
      const message = data.isCorrect 
        ? `${data.playerName} respondió correctamente`
        : `${data.playerName} respondió incorrectamente. La respuesta correcta era: ${data.correctAnswer}`;
      
      announce(message);

      if (data.hasWon) {
        announce(`¡${data.playerName} ha ganado la partida!`);
      }
      
      // Anunciar cambio de turno si cambió
      if (data.turnPlayer !== data.playerName) {
        announce(`Es el turno de ${data.turnPlayer}`);
      }
    });
    
    socket.on('turnChanged', (data) => {
      setGameData(prev => ({
        ...prev,
        currentTurn: data.currentTurn,
        turnPlayer: data.turnPlayer
      }));
      announce(`Es el turno de ${data.turnPlayer}`);
    });

    return () => {
      socket.off('playerJoined');
      socket.off('gameStarted');
      socket.off('answerSubmitted');
      socket.off('turnChanged');
    };
  }, []);

  return (
    <div className="app">
      {/* Skip link para accesibilidad */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      {/* Live region para anuncios */}
      <LiveRegion message={announcement} />

      {/* Contenido principal */}
      <main id="main-content">
        {screen === 'home' && (
          <Home 
            onCreateGame={createGame} 
            onJoinGame={joinGame}
            announce={announce}
          />
        )}

        {screen === 'lobby' && (
          <GameLobby 
            gameData={gameData}
            playerName={playerName}
            onStartGame={startGame}
            announce={announce}
          />
        )}

        {screen === 'game' && (
          <GameBoard 
            gameData={gameData}
            playerName={playerName}
            announce={announce}
            setGameData={setGameData}
          />
        )}
      </main>
    </div>
  );
}

export default App;
