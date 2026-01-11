const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Permitir conexiones desde cualquier origen (WiFi local)
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Health check endpoint para mantener el servicio activo
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'Servidor de Trivial Accesible funcionando',
    timestamp: new Date().toISOString(),
    questions: questions.length
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    questions: questions.length 
  });
});

// Almacenamiento en memoria (migrar a DB en producción)
const games = new Map();

// Cargar preguntas (pueden ser de OpenQuizzDB o locales)
let questions = [];
try {
  questions = require('./data/questions.json');
  console.log(`✅ Cargadas ${questions.length} preguntas`);
} catch (error) {
  console.error('❌ Error cargando preguntas:', error.message);
  console.log('💡 Usa el script convert-openquizzdb.js para generar questions.json');
}

// Generar código de partida único
function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// API REST

// Crear nueva partida
app.post('/api/games/create', (req, res) => {
  const { hostName, gameMode } = req.body;
  const gameCode = generateGameCode();
  
  const game = {
    id: uuidv4(),
    code: gameCode,
    host: hostName,
    mode: gameMode, // 'board' o 'digital'
    players: [{ 
      name: hostName, 
      score: 0, 
      categories: [],
      hasAllCategories: false,
      needsFinalQuestion: false,
      position: 0, // Posición en el tablero (modo digital)
      wedges: [] // Quesitos ganados (modo digital)
    }],
    usedQuestions: [],
    currentQuestion: null,
    currentTurn: 0, // Índice del jugador actual
    turnPlayer: hostName, // Nombre del jugador actual
    lastAnswerCorrect: false, // Si el último jugador acertó
    diceRoll: null, // Resultado del dado
    needsRoll: true, // Si el jugador actual necesita tirar el dado
    status: 'waiting', // waiting, playing, finished
    winner: null,
    createdAt: new Date()
  };
  
  games.set(gameCode, game);
  
  res.json({ 
    success: true, 
    gameCode, 
    game 
  });
});

// Unirse a partida
app.post('/api/games/join', (req, res) => {
  const { gameCode, playerName } = req.body;
  
  const game = games.get(gameCode.toUpperCase());
  
  if (!game) {
    return res.status(404).json({ 
      success: false, 
      message: 'Partida no encontrada' 
    });
  }
  
  if (game.status !== 'waiting') {
    return res.status(400).json({ 
      success: false, 
      message: 'La partida ya ha comenzado' 
    });
  }
  
  const playerExists = game.players.find(p => p.name === playerName);
  if (playerExists) {
    return res.status(400).json({ 
      success: false, 
      message: 'Ese nombre de jugador ya existe en la partida' 
    });
  }
  
  game.players.push({ 
    name: playerName, 
    score: 0, 
    categories: [],
    hasAllCategories: false,
    needsFinalQuestion: false,
    position: 0, // Posición en el tablero (modo digital)
    wedges: [] // Quesitos ganados (modo digital)
  });
  
  // Notificar a todos los jugadores
  io.to(gameCode).emit('playerJoined', { 
    playerName, 
    players: game.players 
  });
  
  res.json({ 
    success: true, 
    game 
  });
});

// Obtener pregunta aleatoria
app.post('/api/games/:gameCode/question', (req, res) => {
  const { gameCode } = req.params;
  const { category, playerName } = req.body;
  
  const game = games.get(gameCode.toUpperCase());
  
  if (!game) {
    return res.status(404).json({ 
      success: false, 
      message: 'Partida no encontrada' 
    });
  }
  
  // Verificar que es el turno del jugador
  if (game.turnPlayer !== playerName) {
    return res.status(403).json({ 
      success: false, 
      message: `No es tu turno. Es el turno de ${game.turnPlayer}` 
    });
  }
  
  // Filtrar preguntas por categoría y no usadas
  const availableQuestions = questions.filter(q => 
    q.category === category && 
    !game.usedQuestions.includes(q.id)
  );
  
  if (availableQuestions.length === 0) {
    return res.status(404).json({ 
      success: false, 
      message: 'No hay más preguntas disponibles en esta categoría' 
    });
  }
  
  // Seleccionar pregunta aleatoria
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  const question = availableQuestions[randomIndex];
  
  // Marcar pregunta como usada
  game.usedQuestions.push(question.id);
  game.currentQuestion = question;
  
  // No enviar la respuesta correcta al cliente
  const { correctAnswer, ...questionWithoutAnswer } = question;
  
  res.json({ 
    success: true, 
    question: questionWithoutAnswer 
  });
});

// Verificar respuesta
app.post('/api/games/:gameCode/answer', (req, res) => {
  const { gameCode } = req.params;
  const { playerName, questionId, answer } = req.body;
  
  const game = games.get(gameCode.toUpperCase());
  
  if (!game || !game.currentQuestion) {
    return res.status(404).json({ 
      success: false, 
      message: 'Pregunta no encontrada' 
    });
  }
  
  // Verificar que es el turno del jugador
  if (game.turnPlayer !== playerName) {
    return res.status(403).json({ 
      success: false, 
      message: `No es tu turno. Es el turno de ${game.turnPlayer}` 
    });
  }
  
  const question = questions.find(q => q.id === questionId);
  const isCorrect = answer === question.correctAnswer;
  const allCategories = ['Geografia', 'Historia', 'Ciencia', 'Arte', 'Deportes', 'Entretenimiento'];
  const player = game.players.find(p => p.name === playerName);
  
  if (isCorrect) {
    if (player) {
      player.score += 1;
      
      // En modo digital, verificar si está en casilla de quesito
      let wonWedge = false;
      if (game.mode === 'digital') {
        const isWedgeSpace = player.position % 6 === 0 && player.position !== 0;
        if (isWedgeSpace && !player.wedges.includes(question.category)) {
          player.wedges.push(question.category);
          wonWedge = true;
          
          // Verificar si completó todas las categorías
          if (player.wedges.length === allCategories.length) {
            player.hasAllCategories = true;
            player.needsFinalQuestion = true;
          }
        }
      } else {
        // En modo tablero físico, usar el sistema de categorías
        if (!player.categories.includes(question.category)) {
          player.categories.push(question.category);
          
          // Verificar si completó todas las categorías
          if (player.categories.length === allCategories.length) {
            player.hasAllCategories = true;
            player.needsFinalQuestion = true;
          }
        }
      }
      
      // Si acierta, mantiene el turno (según reglas Trivial Pursuit)
      game.lastAnswerCorrect = true;
      game.needsRoll = true; // Puede tirar el dado de nuevo
    }
  } else {
    // Si falla, pasar al siguiente turno automáticamente
    game.lastAnswerCorrect = false;
    game.currentTurn = (game.currentTurn + 1) % game.players.length;
    game.turnPlayer = game.players[game.currentTurn].name;
    game.needsRoll = true;
  }
  
  // Verificar si ganó (tiene todas las categorías Y respondió pregunta final)
  let hasWon = false;
  if (player.hasAllCategories && question.isFinal) {
    hasWon = isCorrect;
    if (hasWon) {
      game.status = 'finished';
      game.winner = playerName;
    }
  }
  
  io.to(gameCode).emit('answerSubmitted', {
    playerName,
    isCorrect,
    correctAnswer: question.correctAnswer,
    hasWon,
    players: game.players,
    currentTurn: game.currentTurn,
    turnPlayer: game.turnPlayer,
    needsRoll: game.needsRoll
  });
  
  res.json({ 
    success: true, 
    isCorrect,
    correctAnswer: question.correctAnswer,
    hasWon,
    player,
    game: {
      currentTurn: game.currentTurn,
      turnPlayer: game.turnPlayer,
      lastAnswerCorrect: game.lastAnswerCorrect,
      needsRoll: game.needsRoll,
      mode: game.mode
    }
  });
});

// Pasar turno (cuando fallas o manualmente)
app.post('/api/games/:gameCode/nextTurn', (req, res) => {
  const { gameCode } = req.params;
  const game = games.get(gameCode.toUpperCase());
  
  if (!game) {
    return res.status(404).json({ 
      success: false, 
      message: 'Partida no encontrada' 
    });
  }
  
  // Pasar al siguiente jugador
  game.currentTurn = (game.currentTurn + 1) % game.players.length;
  game.turnPlayer = game.players[game.currentTurn].name;
  game.lastAnswerCorrect = false;
  game.diceRoll = null;
  game.needsRoll = true;
  
  io.to(gameCode).emit('turnChanged', {
    currentTurn: game.currentTurn,
    turnPlayer: game.turnPlayer,
    needsRoll: game.needsRoll
  });
  
  res.json({ 
    success: true,
    currentTurn: game.currentTurn,
    turnPlayer: game.turnPlayer,
    needsRoll: game.needsRoll
  });
});

// Tirar dado (modo digital)
app.post('/api/games/:gameCode/rollDice', (req, res) => {
  const { gameCode } = req.params;
  const { playerName } = req.body;
  const game = games.get(gameCode.toUpperCase());
  
  if (!game) {
    return res.status(404).json({ 
      success: false, 
      message: 'Partida no encontrada' 
    });
  }
  
  // Verificar que es el turno del jugador
  if (game.turnPlayer !== playerName) {
    return res.status(403).json({ 
      success: false, 
      message: `No es tu turno. Es el turno de ${game.turnPlayer}` 
    });
  }
  
  // Verificar que necesita tirar el dado
  if (!game.needsRoll) {
    return res.status(400).json({ 
      success: false, 
      message: 'Ya has tirado el dado este turno' 
    });
  }
  
  // Simular tirada de dado (1-6)
  const diceResult = Math.floor(Math.random() * 6) + 1;
  
  // Guardar el resultado del dado sin mover todavía
  // El jugador elegirá la dirección según reglas oficiales
  const player = game.players.find(p => p.name === playerName);
  player.pendingMove = diceResult;
  game.needsRoll = false;
  
  // Calcular las posiciones posibles con cada dirección
  const oldPosition = player.position;
  const categories = ['Geografia', 'Historia', 'Ciencia', 'Arte', 'Deportes', 'Entretenimiento'];
  
  const clockwisePosition = (oldPosition + diceResult) % 42;
  const counterclockwisePosition = (oldPosition - diceResult + 42) % 42;
  
  // Verificar si son casillas de quesito
  const clockwiseIsWedge = clockwisePosition % 6 === 0 && clockwisePosition !== 0;
  const counterclockwiseIsWedge = counterclockwisePosition % 6 === 0 && counterclockwisePosition !== 0;
  
  // Obtener categorías
  const clockwiseCategory = categories[Math.floor(clockwisePosition / 7) % 6];
  const counterclockwiseCategory = categories[Math.floor(counterclockwisePosition / 7) % 6];
  
  const directionOptions = {
    clockwise: {
      position: clockwisePosition,
      isWedgeSpace: clockwiseIsWedge,
      category: clockwiseCategory
    },
    counterclockwise: {
      position: counterclockwisePosition,
      isWedgeSpace: counterclockwiseIsWedge,
      category: counterclockwiseCategory
    }
  };
  
  io.to(gameCode).emit('diceRolled', {
    playerName: game.turnPlayer,
    result: diceResult,
    needsDirectionChoice: true,
    directionOptions
  });
  
  res.json({ 
    success: true,
    result: diceResult,
    needsDirectionChoice: true,
    directionOptions
  });
});

// Elegir dirección de movimiento (modo digital)
app.post('/api/games/:gameCode/chooseDirection', (req, res) => {
  const { gameCode } = req.params;
  const { playerName, direction } = req.body;
  const game = games.get(gameCode.toUpperCase());
  
  if (!game) {
    return res.status(404).json({ success: false, message: 'Partida no encontrada' });
  }
  
  const player = game.players.find(p => p.name === playerName);
  if (!player || !player.pendingMove) {
    return res.status(400).json({ success: false, message: 'No hay movimiento pendiente' });
  }
  
  const diceResult = player.pendingMove;
  const oldPosition = player.position;
  
  // Calcular nueva posición según dirección elegida
  // Reglas oficiales: puedes moverte en cualquier dirección legal
  let newPosition;
  if (direction === 'clockwise') {
    // Sentido horario en el anillo exterior
    newPosition = (oldPosition + diceResult) % 42;
  } else if (direction === 'counterclockwise') {
    // Sentido antihorario en el anillo exterior
    newPosition = (oldPosition - diceResult + 42) % 42;
  }
  
  // Determinar categoría según posición
  const categories = ['Geografia', 'Historia', 'Ciencia', 'Arte', 'Deportes', 'Entretenimiento'];
  const categoryIndex = Math.floor(newPosition / 7);
  const category = categories[categoryIndex % 6];
  
  // Verificar si es casilla de quesito (cada 6 casillas)
  const isWedgeSpace = newPosition % 6 === 0 && newPosition !== 0;
  
  // Actualizar posición
  player.position = newPosition;
  delete player.pendingMove;
  
  io.to(gameCode).emit('playerMoved', {
    playerName,
    direction,
    newPosition,
    category,
    isWedgeSpace
  });
  
  res.json({ 
    success: true,
    newPosition,
    category,
    isWedgeSpace,
    direction
  });
});

// Obtener estado de la partida
app.get('/api/games/:gameCode', (req, res) => {
  const { gameCode } = req.params;
  const game = games.get(gameCode.toUpperCase());
  
  if (!game) {
    return res.status(404).json({ 
      success: false, 
      message: 'Partida no encontrada' 
    });
  }
  
  res.json({ 
    success: true, 
    game 
  });
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('joinGame', (gameCode) => {
    socket.join(gameCode);
    console.log(`Cliente ${socket.id} se unió a la partida ${gameCode}`);
  });
  
  socket.on('startGame', (gameCode) => {
    const game = games.get(gameCode);
    if (game) {
      game.status = 'playing';
      io.to(gameCode).emit('gameStarted', { game });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Permitir conexiones desde cualquier IP en la red local

server.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Accede localmente en: http://localhost:${PORT}`);
  
  // Mostrar IPs locales para acceso desde móvil
  const networkInterfaces = require('os').networkInterfaces();
  const addresses = [];
  for (const interfaceName in networkInterfaces) {
    for (const iface of networkInterfaces[interfaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  
  if (addresses.length > 0) {
    console.log(`\n📱 Acceso desde móvil:`);
    addresses.forEach(addr => {
      console.log(`   http://${addr}:${PORT}`);
    });
  }
});
