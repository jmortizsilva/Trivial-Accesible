import React, { useState, useEffect } from 'react';
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

const DEFAULT_CATEGORIES = ['Historia', 'Ciencias y Naturaleza', 'Geografía', 'Entretenimiento', 'Deportes y pasatiempos', 'Arte y Literatura'];
const DIGITAL_BOARD_SIZE = 36;
const DIGITAL_WEDGE_INTERVAL = 6;
const DIGITAL_OUTER_TRACK_SIZE = DIGITAL_BOARD_SIZE;
const DIGITAL_BOARD_SEGMENTS = 6;

const CATEGORY_STYLES = {
  historia: { emoji: '📜', color: '#000000', backgroundColor: '#FFED00' },
  'ciencias y naturaleza': { emoji: '🔬', color: '#006400', backgroundColor: '#CFF5CF' },
  geografia: { emoji: '🌍', color: '#005A7A', backgroundColor: '#D6F4FF' },
  entretenimiento: { emoji: '🎬', color: '#7A3E2E', backgroundColor: '#F7DCCF' },
  'deportes y pasatiempos': { emoji: '⚽', color: '#7A2F00', backgroundColor: '#FFA726' },
  'arte y literatura': { emoji: '🎨', color: '#6A0080', backgroundColor: '#F2D9FF' }
};

const normalizeCategory = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

const getCategoryStyle = (categoryName, index) => {
  const normalized = normalizeCategory(categoryName);
  const style = CATEGORY_STYLES[normalized] || CATEGORY_STYLES[categoryName?.toLowerCase()];
  if (style) {
    return style;
  }

  const fallback = [
    { emoji: '📚', color: '#6366f1' },
    { emoji: '🧩', color: '#14b8a6' },
    { emoji: '🎯', color: '#e11d48' },
    { emoji: '🌟', color: '#d97706' }
  ];

  return fallback[index % fallback.length];
};

function GameBoard({ gameData, playerName, announce, setGameData, onPauseGame, onResumeGame, onLeaveGame, onEndGame }) {
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
  const [directionOptions, setDirectionOptions] = useState([]);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [isWedgeSpace, setIsWedgeSpace] = useState(false);

  const currentPlayer = gameData.players.find(p => p.name === playerName);
  const isMyTurn = gameData.turnPlayer === playerName;
  const isDigitalMode = gameData.mode === 'digital';
  const gameCategories = gameData.categories && gameData.categories.length > 0
    ? gameData.categories
    : DEFAULT_CATEGORIES;
  const totalCategories = gameCategories.length;
  const wedgePositionsLabel = Array.from(
    { length: DIGITAL_BOARD_SEGMENTS },
    (_, i) => i * DIGITAL_WEDGE_INTERVAL
  ).join(', ');

  const wedgeDistanceInfo = isDigitalMode && currentPlayer
    ? gameCategories.map((category, index) => {
        const wedgeNode = index * DIGITAL_WEDGE_INTERVAL;
        const distance = (wedgeNode - currentPlayer.position + DIGITAL_BOARD_SIZE) % DIGITAL_BOARD_SIZE;
        return {
          category,
          distance,
          wedgeNode
        };
      })
    : [];

  const wedgeOptionCount = Array.isArray(directionOptions)
    ? directionOptions.filter((option) => option.isWedgeSpace).length
    : 0;

  // Escuchar preguntas de otros jugadores
  useEffect(() => {
    const handleQuestionAsked = (event) => {
      const { question, playerAsking } = event.detail;
      if (playerAsking !== playerName) {
        setCurrentQuestion(question);
        setSelectedAnswer(null);
        setShowResult(false);
        announce(`${playerAsking} está respondiendo una pregunta de ${question.category}`);
      }
    };

    const handleAnswerSubmitted = (event) => {
      const { playerName: answerer, submittedAnswer, isCorrect, correctAnswer, wonWedge, wonWedgeCategory, hasWon, questionId } = event.detail;
      
      // Solo actualizar si la pregunta coincide
      if (currentQuestion && currentQuestion.id === questionId) {
        setResult({
          isCorrect,
          correctAnswer,
          wonWedge,
          wonWedgeCategory,
          hasWon,
          player: answerer
        });
        setSelectedAnswer(submittedAnswer);
        setShowResult(true);
        
        // Si no es mi turno, solo mostrar resultado brevemente y volver
        if (answerer !== playerName) {
          setTimeout(() => {
            setCurrentQuestion(null);
            setShowResult(false);
            setDiceResult(null);
            setSelectedCategory(null);
          }, 5000); // 5 segundos para leer el resultado
        }
      }
    };

    const handleDiceRolled = (event) => {
      const { playerName: roller, result, directionOptions: options } = event.detail;
      if (roller !== playerName) {
        setDiceResult(result);
        setDirectionOptions(Array.isArray(options) ? options : []);
        setNeedsDirectionChoice(false);
      }
    };

    const handlePlayerMoved = (event) => {
      const { playerName: mover, category } = event.detail;
      if (mover !== playerName) {
        setSelectedCategory(category);
        setNeedsDirectionChoice(false);
      }
    };

    window.addEventListener('questionAsked', handleQuestionAsked);
    window.addEventListener('answerSubmitted', handleAnswerSubmitted);
    window.addEventListener('diceRolled', handleDiceRolled);
    window.addEventListener('playerMoved', handlePlayerMoved);
    
    return () => {
      window.removeEventListener('questionAsked', handleQuestionAsked);
      window.removeEventListener('answerSubmitted', handleAnswerSubmitted);
      window.removeEventListener('diceRolled', handleDiceRolled);
      window.removeEventListener('playerMoved', handlePlayerMoved);
    };
  }, [playerName, announce, currentQuestion]);

  // Función para tirar el dado (modo digital)
  const rollDice = async () => {
    if (!isMyTurn) {
      announce(`No es tu turno. Es el turno de ${gameData.turnPlayer}`, { visual: true });
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
        setDirectionOptions(Array.isArray(response.data.directionOptions) ? response.data.directionOptions : []);
        
        // Anunciar opciones detalladas para usuarios ciegos
        const options = Array.isArray(response.data.directionOptions) ? response.data.directionOptions : [];
        
        let announcement = `Dado: ${response.data.result}. `;
        if (options.length > 0) {
          const optionsText = options
            .map((option, index) => `opción ${index + 1}: posición ${option.position}, categoría ${option.category}${option.isWedgeSpace ? ', casilla de quesito' : ''}`)
            .join('. ');
          announcement += `${optionsText}. Elige tu movimiento.`;
        } else {
          announcement += 'No hay opciones de movimiento disponibles.';
        }
        
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
  const chooseDirection = async (selectedOption) => {
    setMovingPlayer(true);
    announce(`Moviendo a la posición ${selectedOption.position}`);

    try {
      const response = await axios.post(
        `${API_URL}/api/games/${gameData.code}/chooseDirection`,
        { playerName, targetPosition: selectedOption.position }
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
      announce(`No es tu turno. Es el turno de ${gameData.turnPlayer}`, { visual: true });
      alert(`No es tu turno. Espera a que ${gameData.turnPlayer} termine.`);
      return;
    }
    
    setLoading(true);
    announce(`Cargando pregunta de ${category}`);
    
    try {
      const response = await axios.post(
        `${API_URL}/api/games/${gameData.code}/question`,
        { category, playerName, isWedgeSpace: !isDigitalMode ? isWedgeSpace : undefined }
      );

      if (response.data.success) {
        setCurrentQuestion(response.data.question);
        setSelectedAnswer(null);
        setShowResult(false);
        setIsWedgeSpace(false); // Reset checkbox after question loaded
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
          lastAnswerCorrect: response.data.game.lastAnswerCorrect,
          needsRoll: response.data.game.needsRoll
        }));

        const message = response.data.isCorrect
          ? `¡Correcto! La respuesta es: ${currentQuestion.options[response.data.correctAnswer]}`
          : `Incorrecto. La respuesta correcta es: ${currentQuestion.options[response.data.correctAnswer]}`;

        const wedgeMessage = response.data.wonWedge
          ? ` Has conseguido un quesito de ${response.data.wonWedgeCategory}.`
          : '';

        announce(`${message}${wedgeMessage}`);

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
    setDirectionOptions([]);
    
    if (result && result.isCorrect) {
      const nextStepMessage = isDigitalMode
        ? '¡Respuesta correcta! Continúas con tu turno. Tira el dado.'
        : '¡Respuesta correcta! Continúas con tu turno. Selecciona otra categoría.';
      announce(nextStepMessage);
    } else {
      // Si fallas, el turno ya cambió automáticamente en el backend
      announce(`Respuesta incorrecta. Es el turno de ${gameData.turnPlayer}`);
    }
  };

  const continueAndRoll = async () => {
    backToCategories();
    setTimeout(() => {
      rollDice();
    }, 150);
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
              <span aria-hidden="true">🎯 </span><strong>¡Es tu turno!</strong> {isDigitalMode && gameData.needsRoll !== false ? 'Tira el dado' : 'Selecciona una categoría'}
            </div>
          ) : (
            <div style={{ fontSize: '1.1rem' }}>
              <span aria-hidden="true">⏳ </span>Es el turno de <strong>{gameData.turnPlayer}</strong>. Espera tu turno...
            </div>
          )}
        </div>

        {/* Indicador de pausa */}
        {gameData.status === 'paused' && (
          <div className="alert" style={{ marginBottom: '1.5rem', background: '#fef3c7', border: '2px solid #fbbf24', color: '#92400e' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              <span aria-hidden="true">⏸️ </span>LA PARTIDA ESTÁ PAUSADA
            </div>
          </div>
        )}

        {/* Botones de control (Pausa, Reanuda, Abandonar, Terminar) */}
        {gameData.status === 'playing' && (
          <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
            {gameData.host === playerName && (
              <button
                onClick={onPauseGame}
                style={{
                  padding: '10px',
                  fontSize: '0.9rem',
                  background: '#f59e0b',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                title="Solo el anfitrión puede pausar"
                aria-label="Pausar partida"
              >
                <span aria-hidden="true">⏸️ </span>Pausar
              </button>
            )}
            <button
              onClick={onLeaveGame}
              style={{
                padding: '10px',
                fontSize: '0.9rem',
                background: '#ef4444',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              title="Abandonar la partida actual"
              aria-label="Abandonar partida"
            >
              <span aria-hidden="true">🚪 </span>Abandonar
            </button>
            {gameData.host === playerName && (
              <button
                onClick={onEndGame}
                style={{
                  padding: '10px',
                  fontSize: '0.9rem',
                  background: '#dc2626',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                title="Terminar la partida para todos"
                aria-label="Terminar partida"
              >
                <span aria-hidden="true">🛑 </span>Terminar
              </button>
            )}
          </div>
        )}

        {/* Botón de Reanudar cuando está pausada */}
        {gameData.status === 'paused' && gameData.host === playerName && (
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={onResumeGame}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                background: '#10b981',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              aria-label="Reanudar partida"
            >
              <span aria-hidden="true">▶️ </span>Reanudar Partida
            </button>
          </div>
        )}

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
            {showScoreboard ? (<><span aria-hidden="true">▼ </span>Ocultar Marcador</>) : (<><span aria-hidden="true">▶ </span>Ver Marcador</>)}
          </button>
        </div>

        {showScoreboard && (
          <div className="scoreboard">
            <h2>Marcador</h2>
            <ul className="players-list" aria-label="Marcador de jugadores">
            {gameData.players.map((player, index) => {
              const progressCount = isDigitalMode ? (player.wedges?.length || 0) : player.categories.length;
              const progressItems = isDigitalMode ? (player.wedges || []) : player.categories;
              const wedgeCount = player.wedges?.length || 0;
              
              return (
                <li 
                  key={index} 
                  className={`player-item ${player.name === playerName ? 'is-host' : ''}`}
                  aria-label={`${player.name}: ${player.score} puntos, ${progressCount} ${isDigitalMode ? 'quesitos' : 'categorías'}${!isDigitalMode && wedgeCount > 0 ? `, ${wedgeCount} quesitos` : ''}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{player.name}</strong>
                      {player.name === playerName && <span> (Tú)</span>}
                    </div>
                    <div className="player-score">
                      {player.score} pts | {progressCount}/{totalCategories} {isDigitalMode ? 'quesitos' : 'categorías'}
                      {!isDigitalMode && wedgeCount > 0 && <span style={{ marginLeft: '8px' }}>({wedgeCount} quesitos)</span>}
                    </div>
                  </div>
                  {progressItems.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                      {isDigitalMode ? 'Quesitos' : 'Categorías'}: {progressItems.join(', ')}
                    </div>
                  )}
                  {!isDigitalMode && wedgeCount > 0 && (
                    <div style={{ marginTop: '4px', fontSize: '0.9rem' }}>
                      Quesitos: {(player.wedges || []).join(', ')}
                    </div>
                  )}
                  {isDigitalMode && player.position !== undefined && (
                    <div style={{ marginTop: '4px', fontSize: '0.85rem', color: '#64748b' }}>
                      <span aria-hidden="true">📍 </span>Posición: {player.position}/{DIGITAL_BOARD_SIZE}
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
            <h2><span aria-hidden="true">🎲 </span>Tablero Digital</h2>

            <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <strong>Distancia a quesitos:</strong>
              <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: '#475569' }}>
                Cuántas casillas faltan para cada quesito si vas en dirección horaria.
              </p>
              <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                {wedgeDistanceInfo.map((item) => (
                  <li key={item.category}>
                    {item.category}: {item.distance === null
                      ? 'sin quesito'
                      : item.distance === 0
                        ? 'ya estás en esa casilla'
                        : `${item.distance} casillas`
                    }
                  </li>
                ))}
              </ul>
            </div>
            
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
                  <span aria-hidden="true">🎲 </span>{diceResult}
                </div>
                {selectedCategory && (
                  <>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '8px' }}>
                      Categoría: {selectedCategory}
                    </div>
                    {currentPlayer.position < DIGITAL_OUTER_TRACK_SIZE && currentPlayer.position % DIGITAL_WEDGE_INTERVAL === 0 && (
                      <div style={{ fontSize: '1rem', color: '#059669', fontWeight: 'bold' }}>
                        <span aria-hidden="true">🎯 </span>¡Casilla de Quesito!
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {/* Elección de dirección */}
            {needsDirectionChoice && isMyTurn && Array.isArray(directionOptions) && directionOptions.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', textAlign: 'center' }}>
                  Elige dirección: Horario o Antihorario
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {directionOptions.map((option, index) => (
                    <button
                      key={`${option.direction}-${index}`}
                      onClick={() => chooseDirection(option)}
                      disabled={movingPlayer}
                      style={{
                        padding: '16px',
                        fontSize: '0.95rem',
                        background: option.isWedgeSpace
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: option.isWedgeSpace ? '3px solid #fbbf24' : 'none'
                      }}
                      aria-label={`${option.direction}: posición ${option.position}, categoría ${option.category}${option.isWedgeSpace ? ', casilla de quesito disponible' : ''}`}
                    >
                      <div><strong>{option.direction === 'horario' ? '🔵 Horario' : '⚪ Antihorario'}</strong></div>
                      <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                        Pos. {option.position}
                      </div>
                      <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                        {option.category}
                      </div>
                      {option.isWedgeSpace && (
                        <div style={{ fontSize: '0.9rem', marginTop: '4px', fontWeight: 'bold' }}>
                          <span aria-hidden="true">🎯 </span>¡QUESITO!
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#64748b', textAlign: 'center' }}>
                  {wedgeOptionCount === 2
                    ? (<><span aria-hidden="true">⭐ </span>Ambas direcciones tienen quesito disponible (borde dorado)</>)
                    : wedgeOptionCount === 1
                      ? (<><span aria-hidden="true">⭐ </span>Una dirección tiene quesito disponible (borde dorado)</>)
                    : 'Elige la dirección hacia la que quieres moverte'}
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
                {rollingDice ? (<><span aria-hidden="true">🎲 </span>Tirando...</>) : (<><span aria-hidden="true">🎲 </span>Tirar Dado</>)}
              </button>
            )}
            
            {!isMyTurn && (
              <div className="alert alert-info">
                Esperando a que <strong>{gameData.turnPlayer}</strong> juegue...
              </div>
            )}
            
            <details style={{ marginTop: '20px', fontSize: '0.9rem', color: '#64748b' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', padding: '8px', background: '#f1f5f9', borderRadius: '6px' }}>
                <span aria-hidden="true">💡 </span>Cómo funciona el modo digital (pulsa para ver instrucciones)
              </summary>
              <ul style={{ paddingLeft: '20px', marginTop: '12px' }}>
                <li>Tira el dado (1-6) para determinar cuántas casillas moverte</li>
                <li><strong>Elige la dirección:</strong> horario o antihorario</li>
                <li>Cada {DIGITAL_WEDGE_INTERVAL} casillas hay un <strong>quesito</strong> disponible (posiciones {wedgePositionsLabel})</li>
                <li>Responde correctamente en esas casillas especiales para ganar el quesito</li>
                <li>Completa los {totalCategories} quesitos (uno por categoría) para ganar</li>
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

            {isMyTurn && (
              <div style={{ marginBottom: '1.5rem', padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isWedgeSpace}
                    onChange={(e) => setIsWedgeSpace(e.target.checked)}
                    aria-label="¿Es una casilla de quesito?"
                  />
                  <span><strong>¿Es una casilla de quesito?</strong> (marca si caíste en una casilla roja)</span>
                </label>
              </div>
            )}

            <div className="categories-grid">
            {gameCategories.map((categoryName, index) => {
              const hasCategory = currentPlayer.categories.includes(categoryName);
              const categoryStyle = getCategoryStyle(categoryName, index);
              
              return (
                <button
                  key={categoryName}
                  className="category-button"
                  onClick={() => getQuestion(categoryName)}
                  disabled={loading || !isMyTurn}
                  style={{ 
                    background: hasCategory 
                      ? '#10b981' 
                      : `linear-gradient(135deg, ${categoryStyle.backgroundColor}, ${categoryStyle.backgroundColor}dd)`,
                    color: categoryStyle.color
                  }}
                  aria-label={`${categoryName}${hasCategory ? ', completada' : ''}${!isMyTurn ? ', no es tu turno' : ''}`}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: isMyTurn ? 1 : 0.5 }} aria-hidden="true">
                    {categoryStyle.emoji}
                  </div>
                  <div>{categoryName}</div>
                  {hasCategory && <div style={{ fontSize: '0.9rem', marginTop: '4px' }}><span aria-hidden="true">✓ </span>Completada</div>}
                  {!isMyTurn && <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.7 }}>Esperando turno...</div>}
                </button>
              );
            })}
          </div>
          </div>
        )}

        {gameData.mode === 'board' && (
          <div className="alert alert-info">
            <span aria-hidden="true">🎲 </span>Recuerda: Usa el tablero físico para moverte y selecciona aquí la categoría según donde caigas
          </div>
        )}
        
        {/* Reglas del Trivial */}
        <details className="alert alert-info" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', listStyle: 'none' }}>
            <span aria-hidden="true">📋 </span>Reglas del Trivial Accesible (pulsa para ver)
          </summary>
          <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
            <li><span aria-hidden="true">✅ </span><strong>Si aciertas:</strong> Continúas jugando y puedes responder otra pregunta</li>
            <li><span aria-hidden="true">❌ </span><strong>Si fallas:</strong> Tu turno termina automáticamente y pasa al siguiente jugador</li>
            <li><span aria-hidden="true">🎯 </span><strong>Objetivo:</strong> Conseguir las {totalCategories} categorías (una de cada color)</li>
          </ul>
        </details>
      </div>
    );
  }

  // Vista de pregunta (visible para todos como en el Trivial físico)
  return (
    <div className="game-container">
      <h1>Pregunta en Juego</h1>

      {/* Indicador de pausa */}
      {gameData.status === 'paused' && (
        <div className="alert" style={{ marginBottom: '1.5rem', background: '#fef3c7', border: '2px solid #fbbf24', color: '#92400e' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            <span aria-hidden="true">⏸️ </span>LA PARTIDA ESTÁ PAUSADA
          </div>
        </div>
      )}

      {/* Indicador de turno siempre visible */}
      <div 
        className={`alert ${isMyTurn ? 'alert-success' : 'alert-info'}`} 
        style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}
      >
        {isMyTurn ? (
          <div><span aria-hidden="true">🎯 </span>Es tu turno - Responde la pregunta</div>
        ) : (
          <div><span aria-hidden="true">👁️ </span>Es el turno de <strong>{gameData.turnPlayer}</strong> - Solo puedes observar</div>
        )}
      </div>

      {/* Botones de control en vista de pregunta */}
      {gameData.status === 'playing' && (
        <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '6px' }}>
          {gameData.host === playerName && (
            <button
              onClick={onPauseGame}
              style={{
                padding: '8px',
                fontSize: '0.85rem',
                background: '#f59e0b',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              aria-label="Pausar partida"
            >
              <span aria-hidden="true">⏸️ </span>Pausar
            </button>
          )}
          <button
            onClick={onLeaveGame}
            style={{
              padding: '8px',
              fontSize: '0.85rem',
              background: '#ef4444',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            aria-label="Abandonar partida"
          >
            <span aria-hidden="true">🚪 </span>Abandonar
          </button>
          {gameData.host === playerName && (
            <button
              onClick={onEndGame}
              style={{
                padding: '8px',
                fontSize: '0.85rem',
                background: '#dc2626',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              aria-label="Terminar partida"
            >
              <span aria-hidden="true">🛑 </span>Terminar
            </button>
          )}
        </div>
      )}

      {/* Botón de Reanudar cuando está pausada */}
      {gameData.status === 'paused' && gameData.host === playerName && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={onResumeGame}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              background: '#10b981',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            aria-label="Reanudar partida"
          >
            <span aria-hidden="true">▶️ </span>Reanudar Partida
          </button>
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
              {result.isCorrect && result.wonWedge && (
                <div style={{ marginTop: '12px', fontSize: '1.05rem', fontWeight: 'bold' }}>
                  ¡Has conseguido un quesito de {result.wonWedgeCategory}!
                </div>
              )}
              {result.isCorrect && result.hasWon && (
                <div style={{ marginTop: '12px', fontSize: '1.2rem' }}>
                  <span aria-hidden="true">🎉 </span>¡Has ganado la partida!
                </div>
              )}
            </div>
          )}

          {showResult && isMyTurn && (
            <button
              onClick={isDigitalMode && result.isCorrect ? continueAndRoll : backToCategories}
              style={{ width: '100%', marginTop: '16px' }}
              aria-label={isDigitalMode && result.isCorrect ? 'Tirar dado para continuar turno' : (result.isCorrect ? 'Continuar con tu turno' : 'Terminar turno')}
            >
              {isDigitalMode && result.isCorrect
                ? (<><span aria-hidden="true">🎲 </span>Tirar Dado y Continuar</>)
                : (result.isCorrect
                  ? (<><span aria-hidden="true">✓ </span>Continuar Mi Turno</>)
                  : (<><span aria-hidden="true">✗ </span>Siguiente Jugador</>))}
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
