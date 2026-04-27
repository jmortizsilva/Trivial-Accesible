import React, { useState, useEffect, useRef } from 'react';
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
  const [visibleNotice, setVisibleNotice] = useState('');
  const noticeTimerRef = useRef(null);

  // Función para anunciar mensajes a lectores de pantalla
  const announce = (message, { visual = false, duration = 4000 } = {}) => {
    setAnnouncement(message);
    if (visual) {
      setVisibleNotice(message);
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
      noticeTimerRef.current = setTimeout(() => {
        setVisibleNotice('');
        noticeTimerRef.current = null;
      }, duration);
    }
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
        announce(`Partida creada con código ${response.data.gameCode}`, { visual: true });
      }
    } catch (error) {
      console.error('Error creando partida:', error);
      announce('Error al crear la partida. Intenta nuevamente.', { visual: true });
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
        announce(`Te has unido a la partida ${gameCode}`, { visual: true });
      }
    } catch (error) {
      console.error('Error uniéndose a partida:', error);
      const message = error.response?.data?.message || 'Error al unirse a la partida';
      announce(message, { visual: true });
      alert(message);
    }
  };

  // Iniciar partida
  const startGame = () => {
    socket.emit('startGame', gameData.code);
    setScreen('game');
    announce('La partida ha comenzado', { visual: true });
  };

  // Pausar partida
  const pauseGame = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/games/${gameData.code}/pause`, {
        playerName
      });
      if (response.data.success) {
        announce('Partida pausada', { visual: true });
      }
    } catch (error) {
      console.error('Error pausando partida:', error);
      const message = error.response?.data?.message || 'Error al pausar la partida';
      announce(message, { visual: true });
    }
  };

  // Reanudar partida
  const resumeGame = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/games/${gameData.code}/resume`, {
        playerName
      });
      if (response.data.success) {
        announce('Partida reanudada', { visual: true });
      }
    } catch (error) {
      console.error('Error reanudando partida:', error);
      const message = error.response?.data?.message || 'Error al reanudar la partida';
      announce(message, { visual: true });
    }
  };

  // Abandonar partida
  const leaveGame = async () => {
    try {
      await axios.post(`${API_URL}/api/games/${gameData.code}/leave`, {
        playerName
      });
      announce('Has abandonado la partida', { visual: true });
      setTimeout(() => {
        setScreen('home');
        setGameData(null);
      }, 1000);
    } catch (error) {
      console.error('Error abandonando partida:', error);
      const message = error.response?.data?.message || 'Error al abandonar la partida';
      announce(message, { visual: true });
    }
  };

  // Terminar partida (solo host)
  const endGame = async () => {
    if (gameData.host !== playerName) {
      announce('Solo el anfitrión puede terminar la partida', { visual: true });
      return;
    }
    try {
      await axios.post(`${API_URL}/api/games/${gameData.code}/end`, {
        playerName
      });
      announce('Partida terminada por el anfitrión', { visual: true });
      setTimeout(() => {
        setScreen('home');
        setGameData(null);
      }, 1000);
    } catch (error) {
      console.error('Error terminando partida:', error);
      const message = error.response?.data?.message || 'Error al terminar la partida';
      announce(message, { visual: true });
    }
  };

  // Escuchar eventos de Socket.io
  useEffect(() => {
    socket.on('playerJoined', (data) => {
      setGameData(prev => ({
        ...prev,
        players: data.players
      }));
      announce(`${data.playerName} se ha unido a la partida`, { visual: true });
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
        turnPlayer: data.turnPlayer,
        needsRoll: data.needsRoll
      }));
      
      // Emitir evento para que GameBoard muestre el resultado a todos
      window.dispatchEvent(new CustomEvent('answerSubmitted', { 
        detail: { 
          playerName: data.playerName,
          submittedAnswer: data.submittedAnswer,
          submittedAnswerText: data.submittedAnswerText,
          isCorrect: data.isCorrect, 
          correctAnswer: data.correctAnswer,
          correctAnswerText: data.correctAnswerText,
          wonWedge: data.wonWedge,
          wonWedgeCategory: data.wonWedgeCategory,
          hasWon: data.hasWon,
          questionId: data.questionId
        } 
      }));
      
      const baseMessage = data.isCorrect
        ? `${data.playerName} respondió correctamente.`
        : `${data.playerName} respondió incorrectamente.`;
      const selectedMessage = data.submittedAnswerText
        ? ` Respondió: ${data.submittedAnswerText}.`
        : '';
      const answerMessage = ` La respuesta correcta era: ${data.correctAnswerText}.`;
      const wedgeMessage = data.wonWedge
        ? ` ${data.playerName} consiguió un quesito de ${data.wonWedgeCategory}.`
        : '';
      const winnerMessage = data.hasWon
        ? ` ¡${data.playerName} ha ganado la partida!`
        : '';
      const turnMessage = data.turnPlayer !== data.playerName
        ? ` Es el turno de ${data.turnPlayer}.`
        : ' Continúa el mismo turno.';

      announce(`${baseMessage}${selectedMessage}${answerMessage}${wedgeMessage}${winnerMessage}${turnMessage}`);
    });
    
    socket.on('turnChanged', (data) => {
      setGameData(prev => ({
        ...prev,
        currentTurn: data.currentTurn,
        turnPlayer: data.turnPlayer
      }));
      announce(`Es el turno de ${data.turnPlayer}`);
    });

    socket.on('questionAsked', (data) => {
      // Emitir evento personalizado para que GameBoard lo capture
      window.dispatchEvent(new CustomEvent('questionAsked', { 
        detail: { 
          question: data.question, 
          playerAsking: data.playerAsking 
        } 
      }));
    });

    socket.on('diceRolled', (data) => {
      window.dispatchEvent(new CustomEvent('diceRolled', { detail: data }));
      announce(`${data.playerName} ha sacado un ${data.result} en el dado`);
    });

    socket.on('playerMoved', (data) => {
      setGameData(prev => ({
        ...prev,
        players: prev.players.map(player =>
          player.name === data.playerName
            ? { ...player, position: data.newPosition }
            : player
        )
      }));

      window.dispatchEvent(new CustomEvent('playerMoved', { detail: data }));
      announce(`${data.playerName} se movió a la posición ${data.newPosition}, categoría ${data.category}`);
    });

    socket.on('gamePaused', (data) => {
      setGameData(prev => ({
        ...prev,
        status: 'paused'
      }));
      announce(`${data.pausedBy} ha pausado la partida`, { visual: true });
    });

    socket.on('gameResumed', (data) => {
      setGameData(prev => ({
        ...prev,
        status: 'playing',
        turnPlayer: data.turnPlayer
      }));
      announce(`${data.resumedBy} ha reanudado la partida`, { visual: true });
    });

    socket.on('gameEnded', (data) => {
      announce(`La partida ha terminado: ${data.reason}`, { visual: true });
      setTimeout(() => {
        setScreen('home');
        setGameData(null);
      }, 3000);
    });

    socket.on('playerLeft', (data) => {
      setGameData(prev => ({
        ...prev,
        players: data.players
      }));
      announce(`${data.playerName} ha abandonado la partida. Jugadores restantes: ${data.players.length}`, { visual: true });
    });

    return () => {
      socket.off('playerJoined');
      socket.off('gameStarted');
      socket.off('answerSubmitted');
      socket.off('turnChanged');
      socket.off('questionAsked');
      socket.off('diceRolled');
      socket.off('playerMoved');
      socket.off('gamePaused');
      socket.off('gameResumed');
      socket.off('gameEnded');
      socket.off('playerLeft');
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
      {visibleNotice && (
        <div className="announcement-banner" role="status" aria-live="off">
          {visibleNotice}
        </div>
      )}

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
            onPauseGame={pauseGame}
            onResumeGame={resumeGame}
            onLeaveGame={leaveGame}
            onEndGame={endGame}
          />
        )}
      </main>

    </div>
  );
}

export default App;
