import React, { useState } from 'react';
import axios from 'axios';

// Detectar automáticamente la URL del backend
const getBackendURL = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  return `http://${window.location.hostname}:3001`;
};

const API_URL = getBackendURL();

const CATEGORIES = [
  { name: 'Geografia', emoji: '🌍', color: '#3b82f6' },
  { name: 'Historia', emoji: '📜', color: '#8b5cf6' },
  { name: 'Ciencia', emoji: '🔬', color: '#10b981' },
  { name: 'Arte', emoji: '🎨', color: '#f59e0b' },
  { name: 'Deportes', emoji: '⚽', color: '#ef4444' },
  { name: 'Entretenimiento', emoji: '🎬', color: '#ec4899' }
];

function GameBoard({ gameData, playerName, announce, setGameData }) {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  const [rollingDice, setRollingDice] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [needsDirectionChoice, setNeedsDirectionChoice] = useState(false);
  const [movingPlayer, setMovingPlayer] = useState(false);
  const [directionOptions, setDirectionOptions] = useState(null);
  const [showScoreboard, setShowScoreboard] = useState(false);

  const currentPlayer = gameData.players.find(p => p.name === playerName);
  const isMyTurn = gameData.turnPlayer === playerName;
  const isDigitalMode = gameData.mode === 'digital';

  // Función para tirar el dado (modo digital)
  const rollDice = async () => {
    if (!isMyTurn) {
      announce(`No es tu turno. Es el turno de ${gameData.turnPlayer}`);
      return;
    }

    setRollingDice(true);
    announce('Tirando el dado');

    try {
      const response = await axios.post(
        `${API_URL}/api/games/${gameData.code}/rollDice`,
        { playerName }
      );

      if (response.data.success) {
        setDiceResult(response.data.result);
        setNeedsDirectionChoice(response.data.needsDirectionChoice);
        setDirectionOptions(response.data.directionOptions);
        
        // Anunciar opciones detalladas para usuarios ciegos
        const clockwise = response.data.directionOptions.clockwise;
        const counter = response.data.directionOptions.counterclockwise;
        
        let announcement = `Dado: ${response.data.result}. `;
        announcement += `Sentido horario: posición ${clockwise.position}, categoría ${clockwise.category}`;
        announcement += clockwise.isWedgeSpace ? ', ¡CASILLA DE QUESITO!' : '';
        announcement += `. Sentido antihorario: posición ${counter.position}, categoría ${counter.category}`;
        announcement += counter.isWedgeSpace ? ', ¡CASILLA DE QUESITO!' : '';
        announcement += '. Elige tu dirección.';
        
        announce(announcement);
      }
    } catch (error) {
      console.error('Error tirando dado:', error);
      const message = error.response?.data?.message || 'Error al tirar el dado';
      announce(message);
      alert(message);
    } finally {
      setRollingDice(false);
    }
  };

  // Función para elegir dirección de movimiento
  const chooseDirection = async (direction) => {
    setMovingPlayer(true);
    const directionLabels = {
      'clockwise': 'sentido horario',
      'counterclockwise': 'sentido antihorario'
    };
    announce(`Moviendo en ${directionLabels[direction]}`);

    try {
      const response = await axios.post(
        `${API_URL}/api/games/${gameData.code}/chooseDirection`,
        { playerName, direction }
      );

      if (response.data.success) {
        setSelectedCategory(response.data.category);
        setNeedsDirectionChoice(false);
        
        // Actualizar posición del jugador
        setGameData(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.name === playerName 
              ? { ...p, position: response.data.newPosition }
              : p
          )
        }));

        const wedgeMessage = response.data.isWedgeSpace 
          ? ' ¡Estás en una casilla de quesito!' 
          : '';
        
        announce(`Te has movido a la posición ${response.data.newPosition}. Categoría: ${response.data.category}.${wedgeMessage}`);
        
        // Obtener pregunta automáticamente
        setTimeout(() => {
          getQuestion(response.data.category);
        }, 1500);
      }
    } catch (error) {
      console.error('Error eligiendo dirección:', error);
      const message = error.response?.data?.message || 'Error al elegir dirección';
      announce(message);
      alert(message);
    } finally {
      setMovingPlayer(false);
    }
  };

  const getQuestion = async (category) => {
    if (!isMyTurn) {
      announce(`No es tu turno. Es el turno de ${gameData.turnPlayer}`);
      alert(`No es tu turno. Espera a que ${gameData.turnPlayer} termine.`);
      return;
    }
    
    setLoading(true);
    announce(`Cargando pregunta de ${category}`);
    
    try {
      const response = await axios.post(
        `${API_URL}/api/games/${gameData.code}/question`,
        { category, playerName }
      );

      if (response.data.success) {
        setCurrentQuestion(response.data.question);
        setSelectedAnswer(null);
        setShowResult(false);
        announce(`Pregunta: ${response.data.question.question}`);
      }
    } catch (error) {
      console.error('Error obteniendo pregunta:', error);
      const message = error.response?.data?.message || 'Error al cargar la pregunta';
      announce(message);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answerIndex) => {
    setSelectedAnswer(answerIndex);
    setLoading(true);
    announce('Enviando respuesta');

    try {
      const response = await axios.post(
        `${API_URL}/api/games/${gameData.code}/answer`,
        {
          playerName,
          questionId: currentQuestion.id,
          answer: answerIndex
        }
      );

      if (response.data.success) {
        setResult(response.data);
        setShowResult(true);
        
        // Actualizar datos del jugador y turno
        setGameData(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.name === playerName ? response.data.player : p
          ),
          currentTurn: response.data.game.currentTurn,
          turnPlayer: response.data.game.turnPlayer,
          lastAnswerCorrect: response.data.game.lastAnswerCorrect
        }));

        const message = response.data.isCorrect
          ? `¡Correcto! La respuesta es: ${currentQuestion.options[response.data.correctAnswer]}`
          : `Incorrecto. La respuesta correcta es: ${currentQuestion.options[response.data.correctAnswer]}`;
        
        announce(message);

        if (response.data.hasWon) {
          setTimeout(() => {
            announce(`¡Felicidades ${playerName}! Has ganado la partida`);
            alert(`¡Felicidades! Has ganado la partida al completar todas las categorías`);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error enviando respuesta:', error);
      announce('Error al enviar la respuesta');
    } finally {
      setLoading(false);
    }
  };

  const backToCategories = () => {
    setCurrentQuestion(null);
    setShowResult(false);
    setDiceResult(null);
    setSelectedCategory(null);
    setNeedsDirectionChoice(false);
    setDirectionOptions(null);
    
    if (result && result.isCorrect) {
      announce('¡Respuesta correcta! Continúas con tu turno. Selecciona otra categoría');
    } else {
      // Si fallas, el turno ya cambió automáticamente en el backend
      announce(`Respuesta incorrecta. Es el turno de ${gameData.turnPlayer}`);
    }
  };

  // Vista de categorías
  if (!currentQuestion) {
    return (
      <div className="game-container">
        <h1>Trivial en Juego</h1>
        
        {/* Indicador de turno */}
        <div className={`alert ${isMyTurn ? 'alert-success' : 'alert-info'}`} style={{ marginBottom: '1.5rem' }}>
          {isMyTurn ? (
            <div style={{ fontSize: '1.1rem' }}>
              🎯 <strong>¡Es tu turno!</strong> {isDigitalMode && gameData.needsRoll !== false ? 'Tira el dado' : 'Selecciona una categoría'}
            </div>
          ) : (
            <div style={{ fontSize: '1.1rem' }}>
              ⏳ Es el turno de <strong>{gameData.turnPlayer}</strong>. Espera tu turno...
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => setShowScoreboard(!showScoreboard)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            aria-label={showScoreboard ? 'Ocultar marcador' : 'Mostrar marcador'}
          >
            {showScoreboard ? '▼ Ocultar Marcador' : '▶ Ver Marcador'}
          </button>
        </div>

        {showScoreboard && (
          <div className="scoreboard">
            <h2>Marcador</h2>
            <ul className="players-list" aria-label="Marcador de jugadores">
            {gameData.players.map((player, index) => {
              const progressCount = isDigitalMode ? (player.wedges?.length || 0) : player.categories.length;
              const progressItems = isDigitalMode ? (player.wedges || []) : player.categories;
              
              return (
                <li 
                  key={index} 
                  className={`player-item ${player.name === playerName ? 'is-host' : ''}`}
                  aria-label={`${player.name}: ${player.score} puntos, ${progressCount} ${isDigitalMode ? 'quesitos' : 'categorías'}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{player.name}</strong>
                      {player.name === playerName && <span> (Tú)</span>}
                    </div>
                    <div className="player-score">
                      {player.score} pts | {progressCount}/6 {isDigitalMode ? 'quesitos' : 'categorías'}
                    </div>
                  </div>
                  {progressItems.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                      {isDigitalMode ? 'Quesitos' : 'Categorías'}: {progressItems.join(', ')}
                    </div>
                  )}
                  {isDigitalMode && player.position !== undefined && (
                    <div style={{ marginTop: '4px', fontSize: '0.85rem', color: '#64748b' }}>
                      📍 Posición: {player.position}/42
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          </div>
        )}

        {/* Modo Digital: Dado Virtual */}
        {isDigitalMode ? (
          <div className="card">
            <h2>🎲 Tablero Digital</h2>
            
            {/* Resultado del dado */}
            {diceResult && (
              <div style={{ 
                padding: '20px', 
                background: '#eff6ff', 
                borderRadius: '12px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>
                  🎲 {diceResult}
                </div>
                {selectedCategory && (
                  <>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '8px' }}>
                      Categoría: {selectedCategory}
                    </div>
                    {currentPlayer.position % 6 === 0 && currentPlayer.position !== 0 && (
                      <div style={{ fontSize: '1rem', color: '#059669', fontWeight: 'bold' }}>
                        🎯 ¡Casilla de Quesito!
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {/* Elección de dirección */}
            {needsDirectionChoice && isMyTurn && directionOptions && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', textAlign: 'center' }}>
                  Elige tu dirección de movimiento:
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    onClick={() => chooseDirection('clockwise')}
                    disabled={movingPlayer}
                    style={{ 
                      padding: '16px',
                      fontSize: '0.95rem',
                      background: directionOptions.clockwise.isWedgeSpace 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: directionOptions.clockwise.isWedgeSpace ? '3px solid #fbbf24' : 'none'
                    }}
                    aria-label={`Mover en sentido horario a posición ${directionOptions.clockwise.position}, categoría ${directionOptions.clockwise.category}${directionOptions.clockwise.isWedgeSpace ? ', casilla de quesito disponible' : ''}`}
                  >
                    <div>➡️ <strong>Sentido Horario</strong></div>
                    <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                      Pos. {directionOptions.clockwise.position} - {directionOptions.clockwise.category}
                    </div>
                    {directionOptions.clockwise.isWedgeSpace && (
                      <div style={{ fontSize: '0.9rem', marginTop: '4px', fontWeight: 'bold' }}>
                        🎯 ¡QUESITO!
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => chooseDirection('counterclockwise')}
                    disabled={movingPlayer}
                    style={{ 
                      padding: '16px',
                      fontSize: '0.95rem',
                      background: directionOptions.counterclockwise.isWedgeSpace 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                        : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      border: directionOptions.counterclockwise.isWedgeSpace ? '3px solid #fbbf24' : 'none'
                    }}
                    aria-label={`Mover en sentido antihorario a posición ${directionOptions.counterclockwise.position}, categoría ${directionOptions.counterclockwise.category}${directionOptions.counterclockwise.isWedgeSpace ? ', casilla de quesito disponible' : ''}`}
                  >
                    <div>⬅️ <strong>Sentido Antihorario</strong></div>
                    <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                      Pos. {directionOptions.counterclockwise.position} - {directionOptions.counterclockwise.category}
                    </div>
                    {directionOptions.counterclockwise.isWedgeSpace && (
                      <div style={{ fontSize: '0.9rem', marginTop: '4px', fontWeight: 'bold' }}>
                        🎯 ¡QUESITO!
                      </div>
                    )}
                  </button>
                </div>
                <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#64748b', textAlign: 'center' }}>
                  {directionOptions.clockwise.isWedgeSpace || directionOptions.counterclockwise.isWedgeSpace 
                    ? '⭐ Hay casillas de quesito disponibles. Los botones con borde dorado tienen quesito.' 
                    : 'Según las reglas oficiales del Trivial Pursuit, puedes elegir la dirección de tu movimiento'}
                </p>
              </div>
            )}
            
            {/* Botón para tirar dado */}
            {isMyTurn && gameData.needsRoll !== false && !needsDirectionChoice && (
              <button
                onClick={rollDice}
                disabled={rollingDice || loading}
                style={{ 
                  width: '100%',
                  padding: '20px',
                  fontSize: '1.2rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
                aria-label="Tirar el dado"
              >
                {rollingDice ? '🎲 Tirando...' : '🎲 Tirar Dado'}
              </button>
            )}
            
            {!isMyTurn && (
              <div className="alert alert-info">
                Esperando a que <strong>{gameData.turnPlayer}</strong> juegue...
              </div>
            )}
            
            <details style={{ marginTop: '20px', fontSize: '0.9rem', color: '#64748b' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', padding: '8px', background: '#f1f5f9', borderRadius: '6px' }}>
                💡 Cómo funciona el modo digital (haz clic para ver instrucciones)
              </summary>
              <ul style={{ paddingLeft: '20px', marginTop: '12px' }}>
                <li>Tira el dado (1-6) para determinar cuántas casillas moverte</li>
                <li><strong>Elige la dirección:</strong> horario o antihorario (como en el Trivial real)</li>
                <li>Cada 6 casillas hay un <strong>quesito</strong> disponible (posiciones 6, 12, 18, 24, 30, 36)</li>
                <li>Responde correctamente en esas casillas especiales para ganar el quesito</li>
                <li>Completa los 6 quesitos (uno por categoría) para ganar</li>
              </ul>
            </details>
          </div>
        ) : (
          /* Modo Tablero Físico: Selección de Categorías */
          <div className="card">
            <h2>Selecciona una Categoría</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Elige la categoría según donde hayas caído en tu tablero físico
            </p>

            <div className="categories-grid">
            {CATEGORIES.map((category) => {
              const hasCategory = currentPlayer.categories.includes(category.name);
              
              return (
                <button
                  key={category.name}
                  className="category-button"
                  onClick={() => getQuestion(category.name)}
                  disabled={loading || !isMyTurn}
                  style={{ 
                    background: hasCategory 
                      ? '#10b981' 
                      : `linear-gradient(135deg, ${category.color}, ${category.color}dd)`
                  }}
                  aria-label={`${category.name}${hasCategory ? ', completada' : ''}${!isMyTurn ? ', no es tu turno' : ''}`}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: isMyTurn ? 1 : 0.5 }}>
                    {category.emoji}
                  </div>
                  <div>{category.name}</div>
                  {hasCategory && <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>✓ Completada</div>}
                  {!isMyTurn && <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.7 }}>Esperando turno...</div>}
                </button>
              );
            })}
          </div>
          </div>
        )}

        {gameData.mode === 'board' && (
          <div className="alert alert-info">
            🎲 Recuerda: Usa el tablero físico para moverte y selecciona aquí la categoría según donde caigas
          </div>
        )}
        
        {/* Reglas del Trivial */}
        <details className="alert alert-info" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', listStyle: 'none' }}>
            📋 Reglas del Trivial Pursuit (haz clic para ver)
          </summary>
          <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
            <li>✅ <strong>Si aciertas:</strong> Continúas jugando y puedes responder otra pregunta</li>
            <li>❌ <strong>Si fallas:</strong> Tu turno termina automáticamente y pasa al siguiente jugador</li>
            <li>🎯 <strong>Objetivo:</strong> Conseguir las 6 categorías (una de cada color)</li>
          </ul>
        </details>
      </div>
    );
  }

  // Vista de pregunta (visible para todos como en el Trivial físico)
  return (
    <div className="game-container">
      <h1>Pregunta</h1>

      {!isMyTurn && !showResult && (
        <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
          👁️ Es el turno de <strong>{gameData.turnPlayer}</strong>. Puedes ver la pregunta pero no responder.
        </div>
      )}

      <div className="card">
        <div style={{ 
          display: 'inline-block', 
          padding: '8px 16px', 
          background: '#eff6ff', 
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <strong>Categoría: {currentQuestion.category}</strong>
        </div>

        <div className="question-card">
          <h2 className="question-text" aria-label={`Pregunta: ${currentQuestion.question}`}>
            {currentQuestion.question}
          </h2>

          <ul className="options-list" aria-label="Opciones de respuesta">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = 'option-button';
              let isDisabled = showResult || loading || !isMyTurn;

              // Si ya se mostró el resultado, solo mostrar la correcta y la seleccionada (si es incorrecta)
              if (showResult) {
                const isCorrectAnswer = index === result.correctAnswer;
                const isSelectedWrong = index === selectedAnswer && !result.isCorrect;
                
                // Ocultar las demás opciones
                if (!isCorrectAnswer && !isSelectedWrong) {
                  return null;
                }
                
                if (isCorrectAnswer) {
                  buttonClass += ' correct';
                } else if (isSelectedWrong) {
                  buttonClass += ' incorrect';
                }
              }

              return (
                <li key={index}>
                  <button
                    className={buttonClass}
                    onClick={() => !showResult && isMyTurn && submitAnswer(index)}
                    disabled={isDisabled}
                    aria-label={`Opción ${index + 1}: ${option}${showResult && index === result.correctAnswer ? ', respuesta correcta' : ''}${!isMyTurn ? ', no es tu turno' : ''}`}
                  >
                    <strong>{index + 1}.</strong> {option}
                  </button>
                </li>
              );
            })}
          </ul>

          {showResult && (
            <div className={`alert ${result.isCorrect ? 'alert-success' : 'alert-error'}`}>
              {result.isCorrect 
                ? '✓ ¡Respuesta correcta! Continúas con tu turno' 
                : `✗ Respuesta incorrecta. La correcta era: ${currentQuestion.options[result.correctAnswer]}. Tu turno ha terminado`
              }
              {result.isCorrect && result.hasWon && (
                <div style={{ marginTop: '12px', fontSize: '1.2rem' }}>
                  🎉 ¡Has ganado la partida!
                </div>
              )}
              
              {/* Mostrar anécdota si existe (OpenQuizzDB) */}
              {currentQuestion.anecdote && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '12px', 
                  background: '#f0f9ff',
                  borderLeft: '4px solid #0ea5e9',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>💡 ¿Sabías que...?</div>
                  <div style={{ fontSize: '0.95rem' }}>{currentQuestion.anecdote}</div>
                </div>
              )}
              
              {/* Enlace a Wikipedia si existe (OpenQuizzDB) */}
              {currentQuestion.wikipedia && (
                <div style={{ marginTop: '12px' }}>
                  <a 
                    href={currentQuestion.wikipedia}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#0ea5e9',
                      textDecoration: 'underline'
                    }}
                    aria-label="Más información en Wikipedia (se abre en nueva pestaña)"
                  >
                    📚 Más información en Wikipedia →
                  </a>
                </div>
              )}
              
              {/* Atribución OpenQuizzDB si la pregunta es de allí */}
              {currentQuestion.source === 'OpenQuizzDB' && (
                <div style={{ 
                  marginTop: '12px', 
                  fontSize: '0.85rem',
                  color: '#64748b'
                }}>
                  Pregunta por <a 
                    href="https://www.openquizzdb.org/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#64748b', textDecoration: 'underline' }}
                  >
                    OpenQuizzDB
                  </a>
                </div>
              )}
            </div>
          )}

          {showResult && isMyTurn && (
            <button
              onClick={backToCategories}
              style={{ width: '100%', marginTop: '16px' }}
              aria-label={result.isCorrect ? 'Continuar con tu turno' : 'Terminar turno'}
            >
              {result.isCorrect ? '✓ Continuar Mi Turno' : '✗ Siguiente Jugador'}
            </button>
          )}
          
          {showResult && !isMyTurn && (
            <div className="alert alert-info" style={{ marginTop: '16px' }}>
              Esperando a que <strong>{gameData.turnPlayer}</strong> continúe...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GameBoard;
