// Trivial Accesible - Backend API
// Versión: 2.0 - Códigos memorables
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

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
// Endpoint raíz para verificar que el servidor está activo
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'online',
    service: 'Trivial Accesible API',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    questions: questions.length,
    version: '1.0.0'
  });
});

// Health check alternativo
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    questions: questions.length 
  });
});

// Ping endpoint para mantener el servicio activo (Cron-Job)
app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

// Endpoint de status más completo
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    activeGames: games.size,
    totalQuestions: questions.length,
    uptime: process.uptime()
  });
});

// Almacenamiento en memoria (migrar a DB en producción)
const games = new Map();

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function adaptQuestion(rawQuestion) {
  if (rawQuestion && rawQuestion.category && rawQuestion.question && Array.isArray(rawQuestion.options)) {
    return rawQuestion;
  }

  if (!rawQuestion || !rawQuestion.categoria || !rawQuestion.pregunta || !Array.isArray(rawQuestion.opciones)) {
    return null;
  }

  const options = rawQuestion.opciones;
  const normalizedCorrect = normalizeText(rawQuestion.respuesta_correcta);
  const correctAnswer = options.findIndex((option) => normalizeText(option) === normalizedCorrect);

  if (correctAnswer < 0) {
    return null;
  }

  const difficultyMap = {
    facil: 'easy',
    media: 'medium',
    dificil: 'hard',
    experto: 'expert'
  };

  return {
    id: rawQuestion.id,
    category: rawQuestion.categoria,
    question: rawQuestion.pregunta,
    options,
    correctAnswer,
    difficulty: difficultyMap[normalizeText(rawQuestion.dificultad)] || 'medium',
    source: 'Preguntas Trivial Accesible 300',
    author: rawQuestion.autor || 'Dataset local'
  };
}

function loadQuestions() {
  const candidates = [
    path.join(__dirname, 'data', 'preguntas_trivial_accesible_300.json'),
    path.join(__dirname, 'data', 'questions.json')
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    try {
      const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const adapted = rawData.map(adaptQuestion).filter(Boolean);

      if (adapted.length === 0) {
        console.warn(`⚠️ ${path.basename(filePath)} no contiene preguntas válidas`);
        continue;
      }

      console.log(`✅ Cargadas ${adapted.length} preguntas desde ${path.basename(filePath)}`);
      return adapted;
    } catch (error) {
      console.error(`❌ Error leyendo ${path.basename(filePath)}:`, error.message);
    }
  }

  return [];
}

// Cargar preguntas (dataset accesible prioritario con fallback)
const questions = loadQuestions();
const GAME_CATEGORIES = [...new Set(questions.map((q) => q.category))];
const DIGITAL_BOARD_SIZE = 42;
const DIGITAL_BOARD_SEGMENTS = 6;
const DIGITAL_CATEGORY_SPAN = DIGITAL_BOARD_SIZE / DIGITAL_BOARD_SEGMENTS;
const DIGITAL_WEDGE_INTERVAL = 6;

if (GAME_CATEGORIES.length === 0) {
  console.error('❌ No hay categorías disponibles. Revisa los archivos de preguntas.');
}

// Lista de palabras para códigos de partida
const PALABRAS_CODIGO = [
  'DRAGON', 'FENIX', 'TIGRE', 'AGUILA', 'LOBO', 'ORCA', 'PUMA', 'HALCON',
  'ZORRO', 'DELFIN', 'LEOPARDO', 'COBRA', 'BUHO', 'CONDOR', 'LINCE', 'KOALA',
  'PANTERA', 'CIERVO', 'CASTOR', 'NUTRIA', 'SALMON', 'TRUCHA', 'ATUN', 'PULPO',
  'MEDUSA', 'ESTRELLA', 'CORAL', 'PERLA', 'DIAMANTE', 'RUBI', 'ZAFIRO', 'TOPACIO',
  'LUNA', 'SOL', 'VENUS', 'MARTE', 'JUPITER', 'SATURNO', 'COMETA', 'GALAXIA',
  'NEBULA', 'AURORA', 'ECLIPSE', 'METEORO', 'QUASAR', 'PULSAR', 'TITAN', 'TRITON',
  'VOLCAN', 'CASCADA', 'MONTAÑA', 'BOSQUE', 'OCEANO', 'DESIERTO', 'SELVA', 'GLACIAR'
];

// Generar palabra clave única para partida
function generateGameCode() {
  const palabraBase = PALABRAS_CODIGO[Math.floor(Math.random() * PALABRAS_CODIGO.length)];
  const numero = Math.floor(Math.random() * 100);
  return `${palabraBase}${numero}`;
}

// API REST

// Crear nueva partida
app.post('/api/games/create', (req, res) => {
  const { hostName, gameMode } = req.body;

  if (questions.length === 0 || GAME_CATEGORIES.length === 0) {
    return res.status(500).json({
      success: false,
      message: 'No hay preguntas o categorias disponibles para crear partidas.'
    });
  }

  // El modo digital usa un tablero fijo de 42 casillas dividido en 6 segmentos.
  if (gameMode === 'digital' && GAME_CATEGORIES.length !== DIGITAL_BOARD_SEGMENTS) {
    return res.status(500).json({
      success: false,
      message: `El modo digital requiere exactamente ${DIGITAL_BOARD_SEGMENTS} categorias. Disponibles: ${GAME_CATEGORIES.length}.`
    });
  }

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
    categories: [...GAME_CATEGORIES],
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
  
  // Emitir la pregunta a TODOS los jugadores vía Socket.IO
  io.to(gameCode.toUpperCase()).emit('questionAsked', {
    question: questionWithoutAnswer,
    playerAsking: playerName
  });
  
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

  if (String(game.currentQuestion.id) !== String(questionId)) {
    return res.status(400).json({
      success: false,
      message: 'La respuesta no corresponde a la pregunta actual.'
    });
  }
  
  const question = game.currentQuestion;
  const isCorrect = answer === question.correctAnswer;
  const allCategories = game.categories || GAME_CATEGORIES;
  const player = game.players.find(p => p.name === playerName);
  let wonWedge = false;
  let wonWedgeCategory = null;
  
  if (isCorrect) {
    if (player) {
      player.score += 1;
      
      // En modo digital, verificar si está en casilla de quesito
      if (game.mode === 'digital') {
        const isWedgeSpace = player.position % DIGITAL_WEDGE_INTERVAL === 0 && player.position !== 0;
        if (isWedgeSpace && !player.wedges.includes(question.category)) {
          player.wedges.push(question.category);
          wonWedge = true;
          wonWedgeCategory = question.category;
          
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
    correctAnswerText: question.options[question.correctAnswer],
    wonWedge,
    wonWedgeCategory,
    hasWon,
    players: game.players,
    currentTurn: game.currentTurn,
    turnPlayer: game.turnPlayer,
    needsRoll: game.needsRoll,
    questionId: question.id
  });
  
  res.json({ 
    success: true, 
    isCorrect,
    correctAnswer: question.correctAnswer,
    wonWedge,
    wonWedgeCategory,
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
  const categories = Array.isArray(game.categories) && game.categories.length > 0
    ? game.categories
    : GAME_CATEGORIES;

  if (categories.length === 0) {
    return res.status(500).json({
      success: false,
      message: 'No hay categorias disponibles para calcular el movimiento.'
    });
  }

  if (game.mode === 'digital' && categories.length !== DIGITAL_BOARD_SEGMENTS) {
    return res.status(500).json({
      success: false,
      message: `La partida digital requiere ${DIGITAL_BOARD_SEGMENTS} categorias. Recibidas: ${categories.length}.`
    });
  }
  const categoryCount = categories.length;
  
  const clockwisePosition = (oldPosition + diceResult) % DIGITAL_BOARD_SIZE;
  const counterclockwisePosition = (oldPosition - diceResult + DIGITAL_BOARD_SIZE) % DIGITAL_BOARD_SIZE;
  
  // Verificar si son casillas de quesito
  const clockwiseIsWedge = clockwisePosition % DIGITAL_WEDGE_INTERVAL === 0 && clockwisePosition !== 0;
  const counterclockwiseIsWedge = counterclockwisePosition % DIGITAL_WEDGE_INTERVAL === 0 && counterclockwisePosition !== 0;
  
  // Obtener categorías
  const clockwiseCategory = categories[Math.floor(clockwisePosition / DIGITAL_CATEGORY_SPAN) % categoryCount];
  const counterclockwiseCategory = categories[Math.floor(counterclockwisePosition / DIGITAL_CATEGORY_SPAN) % categoryCount];
  
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
  
  if (direction !== 'clockwise' && direction !== 'counterclockwise') {
    return res.status(400).json({ success: false, message: 'Direccion no valida' });
  }

  const diceResult = player.pendingMove;
  const oldPosition = player.position;
  
  // Calcular nueva posición según dirección elegida
  // Reglas oficiales: puedes moverte en cualquier dirección legal
  let newPosition;
  if (direction === 'clockwise') {
    // Sentido horario en el anillo exterior
    newPosition = (oldPosition + diceResult) % DIGITAL_BOARD_SIZE;
  } else if (direction === 'counterclockwise') {
    // Sentido antihorario en el anillo exterior
    newPosition = (oldPosition - diceResult + DIGITAL_BOARD_SIZE) % DIGITAL_BOARD_SIZE;
  }
  
  // Determinar categoría según posición
  const categories = Array.isArray(game.categories) && game.categories.length > 0
    ? game.categories
    : GAME_CATEGORIES;
  if (categories.length === 0) {
    return res.status(500).json({
      success: false,
      message: 'No hay categorias disponibles para determinar la casilla.'
    });
  }

  if (game.mode === 'digital' && categories.length !== DIGITAL_BOARD_SEGMENTS) {
    return res.status(500).json({
      success: false,
      message: `La partida digital requiere ${DIGITAL_BOARD_SEGMENTS} categorias. Recibidas: ${categories.length}.`
    });
  }

  const categoryCount = categories.length;
  const categoryIndex = Math.floor(newPosition / DIGITAL_CATEGORY_SPAN);
  const category = categories[categoryIndex % categoryCount];
  
  // Verificar si es casilla de quesito (cada 6 casillas)
  const isWedgeSpace = newPosition % DIGITAL_WEDGE_INTERVAL === 0 && newPosition !== 0;
  
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

// Health check - mantener servidor activo
app.get('/api/games', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    games: games.size,
    timestamp: Date.now()
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

// En producción (Render), no especificar HOST
// En local, usar 0.0.0.0 para permitir acceso desde red local
const HOST = process.env.NODE_ENV === 'production' ? undefined : '0.0.0.0';

if (HOST) {
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
} else {
  // En producción (Render), no especificar HOST
  server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
  });
}
