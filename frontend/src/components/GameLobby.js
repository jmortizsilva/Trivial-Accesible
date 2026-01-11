import React, { useState } from 'react';

function GameLobby({ gameData, playerName, onStartGame, announce }) {
  const isHost = gameData.players[0].name === playerName;
  const [copiedLink, setCopiedLink] = useState(false);
  
  const gameUrl = `${window.location.origin}?join=${gameData.code}`;
  
  const copyLinkToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopiedLink(true);
      announce('Enlace copiado al portapapeles');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (error) {
      // Fallback para navegadores sin soporte de clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = gameUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedLink(true);
        announce('Enlace copiado al portapapeles');
        setTimeout(() => setCopiedLink(false), 3000);
      } catch (err) {
        announce('No se pudo copiar el enlace');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="game-container">
      <h1>Sala de Espera</h1>

      <div className="card">
        <h2>Código de Partida</h2>
        <div className="game-code" aria-label={`Código de partida: ${gameData.code}`}>
          {gameData.code}
        </div>
        <p style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '1rem' }}>
          Comparte este código o enlace con otros jugadores
        </p>
        <button 
          onClick={copyLinkToClipboard}
          style={{ 
            width: '100%',
            padding: '12px 20px',
            fontSize: '1rem',
            background: copiedLink ? '#10b981' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          aria-label={copiedLink ? 'Enlace copiado' : 'Copiar enlace de la partida'}
        >
          {copiedLink ? (
            <>
              <span>✓</span>
              <span>Enlace Copiado</span>
            </>
          ) : (
            <>
              <span>🔗</span>
              <span>Copiar Enlace para Compartir</span>
            </>
          )}
        </button>
        <p style={{ 
          fontSize: '0.85rem', 
          color: '#64748b', 
          marginTop: '8px',
          textAlign: 'center'
        }}>
          {gameUrl}
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
