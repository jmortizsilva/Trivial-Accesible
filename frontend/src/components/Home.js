import React, { useState, useEffect } from 'react';

function Home({ onCreateGame, onJoinGame, announce }) {
  const [action, setAction] = useState(null); // 'create' o 'join'
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [gameMode, setGameMode] = useState('board'); // 'board' o 'digital'

  // Detectar si hay un código en la URL (?join=CODIGO)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    if (joinCode) {
      setGameCode(joinCode.toUpperCase());
      setAction('join');
      announce(`Enlace detectado. Únete a la partida ${joinCode}`);
    }
  }, [announce]);

  const handleCreateGame = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      onCreateGame(playerName, gameMode);
    } else {
      announce('Por favor, ingresa tu nombre');
    }
  };

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (playerName.trim() && gameCode.trim()) {
      onJoinGame(gameCode, playerName);
    } else {
      announce('Por favor, ingresa tu nombre y el código de la partida');
    }
  };

  return (
    <div className="game-container">
      <header>
        <h1>Trivial Accesible</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          Juego de preguntas y respuestas accesible para todos
        </p>
      </header>

      {!action && (
        <div className="card">
          <h2>¿Qué deseas hacer?</h2>
          <div className="button-group">
            <button 
              onClick={() => {
                setAction('create');
                announce('Crear nueva partida seleccionado');
              }}
              aria-label="Crear una nueva partida"
            >
              Crear Partida Nueva
            </button>
            <button 
              onClick={() => {
                setAction('join');
                announce('Unirse a partida seleccionado');
              }}
              className="secondary"
              aria-label="Unirse a una partida existente"
            >
              Unirse a Partida
            </button>
          </div>
        </div>
      )}

      {action === 'create' && (
        <div className="card">
          <h2>Crear Nueva Partida</h2>
          <form onSubmit={handleCreateGame}>
            <div className="form-group">
              <label htmlFor="host-name">
                Tu nombre *
              </label>
              <input
                id="host-name"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ingresa tu nombre"
                required
                aria-required="true"
                autoFocus
              />
            </div>

            <div className="form-group">
              <fieldset>
                <legend style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '16px' }}>
                  Modo de juego *
                </legend>
                
                <div className="mode-selector">
                  <label
                    className={`mode-card ${gameMode === 'board' ? 'selected' : ''}`}
                    htmlFor="mode-board"
                  >
                    <input
                      id="mode-board"
                      type="radio"
                      name="game-mode"
                      value="board"
                      checked={gameMode === 'board'}
                      onChange={() => {
                        setGameMode('board');
                        announce('Modo con tablero físico seleccionado');
                      }}
                    />
                    <h3>🎲 Con Tablero Físico</h3>
                    <p>Usa un tablero físico y la aplicación solo para las preguntas</p>
                  </label>

                  <label
                    className={`mode-card ${gameMode === 'digital' ? 'selected' : ''}`}
                    htmlFor="mode-digital"
                  >
                    <input
                      id="mode-digital"
                      type="radio"
                      name="game-mode"
                      value="digital"
                      checked={gameMode === 'digital'}
                      onChange={() => {
                        setGameMode('digital');
                        announce('Modo solo digital seleccionado');
                      }}
                    />
                    <h3>📱 Solo Digital</h3>
                    <p>Juega completamente desde la aplicación</p>
                  </label>
                </div>
              </fieldset>
            </div>

            <div className="button-group">
              <button type="submit" aria-label="Crear partida">
                Crear Partida
              </button>
              <button 
                type="button" 
                className="secondary"
                onClick={() => {
                  setAction(null);
                  announce('Volviendo al menú principal');
                }}
                aria-label="Volver al menú principal"
              >
                Volver
              </button>
            </div>
          </form>
        </div>
      )}

      {action === 'join' && (
        <div className="card">
          <h2>Unirse a Partida</h2>
          <form onSubmit={handleJoinGame}>
            <div className="form-group">
              <label htmlFor="player-name">
                Tu nombre *
              </label>
              <input
                id="player-name"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ingresa tu nombre"
                required
                aria-required="true"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="game-code">
                Código de partida *
              </label>
              <input
                id="game-code"
                type="text"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder="Ej: DRAGON42"
                required
                aria-required="true"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="button-group">
              <button type="submit" aria-label="Unirse a la partida">
                Unirse
              </button>
              <button 
                type="button" 
                className="secondary"
                onClick={() => {
                  setAction(null);
                  announce('Volviendo al menú principal');
                }}
                aria-label="Volver al menú principal"
              >
                Volver
              </button>
            </div>
          </form>
        </div>
      )}

      <footer style={{ marginTop: '3rem', textAlign: 'center', color: '#6b7280' }}>
        <p>Diseñado para ser accesible con lectores de pantalla</p>
      </footer>
    </div>
  );
}

export default Home;
