import React from 'react';

function GameLobby({ gameData, playerName, onStartGame, announce }) {
  const isHost = gameData.players[0].name === playerName;

  return (
    <div className="game-container">
      <h1>Sala de Espera</h1>

      <div className="card">
        <h2>Código de Partida</h2>
        <div className="game-code" aria-label={`Código de partida: ${gameData.code}`}>
          {gameData.code}
        </div>
        <p style={{ textAlign: 'center', fontSize: '1.1rem' }}>
          Comparte este código con otros jugadores para que se unan
        </p>
      </div>

      <div className="card">
        <h2>Modo de Juego</h2>
        <div className="alert alert-info">
          {gameData.mode === 'board' 
            ? '🎲 Con tablero físico' 
            : '📱 Solo digital'
          }
        </div>
      </div>

      <div className="card">
        <h2>Jugadores ({gameData.players.length})</h2>
        <ul className="players-list" aria-label="Lista de jugadores">
          {gameData.players.map((player, index) => (
            <li 
              key={index} 
              className={`player-item ${index === 0 ? 'is-host' : ''}`}
              aria-label={`${player.name}${index === 0 ? ', anfitrión' : ''}`}
            >
              <strong>{player.name}</strong>
              {index === 0 && <span> (Anfitrión)</span>}
            </li>
          ))}
        </ul>
      </div>

      {isHost ? (
        <div className="card">
          <h2>Opciones del Anfitrión</h2>
          <p style={{ marginBottom: '1rem' }}>
            Cuando todos los jugadores estén listos, inicia la partida
          </p>
          <button 
            onClick={() => {
              onStartGame();
              announce('Iniciando partida');
            }}
            disabled={gameData.players.length < 1}
            aria-label="Iniciar partida"
            style={{ width: '100%' }}
          >
            Iniciar Partida
          </button>
        </div>
      ) : (
        <div className="alert alert-info">
          Esperando a que el anfitrión inicie la partida...
        </div>
      )}

      <div className="card" style={{ background: '#f9fafb' }}>
        <h3>Instrucciones</h3>
        <ol>
          <li>Espera a que todos los jugadores se unan</li>
          <li>El anfitrión iniciará la partida</li>
          <li>Cada jugador responderá preguntas de diferentes categorías</li>
          <li>El objetivo es completar todas las categorías</li>
          <li>¡Gana quien complete todas las categorías primero!</li>
        </ol>
      </div>
    </div>
  );
}

export default GameLobby;
