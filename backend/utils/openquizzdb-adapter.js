/**
 * Adaptador para convertir preguntas de OpenQuizzDB a nuestro formato
 * OpenQuizzDB: https://www.openquizzdb.org/
 * Licencia: CC BY-SA 4.0
 */

/**
 * Mapeo de dificultades OpenQuizzDB a nuestro formato
 */
const DIFFICULTY_MAP = {
  '1': 'easy',
  '2': 'medium',
  '3': 'hard',
  '4': 'expert'
};

/**
 * Mapeo de categorías (francés/español a las 6 categorías estándar del Trivial Pursuit)
 * 
 * Las 6 categorías estándar son:
 * 1. Geografia (azul) - Geografía y lugares
 * 2. Historia (amarillo) - Historia y acontecimientos
 * 3. Arte (marrón) - Arte, literatura, música
 * 4. Ciencia (verde) - Ciencia, naturaleza, tecnología
 * 5. Deportes (naranja) - Deportes y pasatiempos
 * 6. Entretenimiento (rosa) - Cine, TV, espectáculos
 */
const CATEGORY_MAP = {
  // === GEOGRAFÍA (AZUL) ===
  'Géographie': 'Geografia',
  'Geografía': 'Geografia',
  'Geografia': 'Geografia',
  
  // === HISTORIA (AMARILLO) ===
  'Histoire': 'Historia',
  'Historia': 'Historia',
  'Mythologie': 'Historia',
  'Mitología': 'Historia',
  'Personnages célèbres': 'Historia',
  'Personajes célebres': 'Historia',
  
  // === ARTE Y LITERATURA (MARRÓN) ===
  'Arts': 'Arte',
  'Arte': 'Arte',
  'Littérature': 'Arte',
  'Literatura': 'Arte',
  'Musique': 'Arte',
  'Música': 'Arte',
  'Peinture': 'Arte',
  'Pintura': 'Arte',
  'Sculpture': 'Arte',
  'Escultura': 'Arte',
  'BD': 'Arte',
  'Cómic': 'Arte',
  'Mangas': 'Arte',
  'Poésie': 'Arte',
  'Poesía': 'Arte',
  
  // === CIENCIA Y NATURALEZA (VERDE) ===
  'Sciences': 'Ciencia',
  'Ciencias': 'Ciencia',
  'Ciencia': 'Ciencia',
  'Nature': 'Ciencia',
  'Naturaleza': 'Ciencia',
  'Animaux': 'Ciencia',
  'Animales': 'Ciencia',
  'Biologie': 'Ciencia',
  'Biología': 'Ciencia',
  'Physique': 'Ciencia',
  'Física': 'Ciencia',
  'Chimie': 'Ciencia',
  'Química': 'Ciencia',
  'Astronomie': 'Ciencia',
  'Astronomía': 'Ciencia',
  'Mathématiques': 'Ciencia',
  'Matemáticas': 'Ciencia',
  'Technologie': 'Ciencia',
  'Tecnología': 'Ciencia',
  'Informatique': 'Ciencia',
  'Informática': 'Ciencia',
  
  // === DEPORTES Y PASATIEMPOS (NARANJA) ===
  'Sports': 'Deportes',
  'Deportes': 'Deportes',
  'Loisirs': 'Deportes',
  'Pasatiempos': 'Deportes',
  'Automobile': 'Deportes',
  'Automóvil': 'Deportes',
  'Football': 'Deportes',
  'Fútbol': 'Deportes',
  'Basket': 'Deportes',
  'Baloncesto': 'Deportes',
  'Tennis': 'Deportes',
  'Tenis': 'Deportes',
  'Jeux': 'Deportes',
  'Juegos': 'Deportes',
  
  // === ENTRETENIMIENTO (ROSA) ===
  'Divertissement': 'Entretenimiento',
  'Entretenimiento': 'Entretenimiento',
  'Cinéma': 'Entretenimiento',
  'Cine': 'Entretenimiento',
  'Télévision': 'Entretenimiento',
  'Televisión': 'Entretenimiento',
  'TV': 'Entretenimiento',
  'Séries': 'Entretenimiento',
  'Series': 'Entretenimiento',
  'Musique populaire': 'Entretenimiento',
  'Música popular': 'Entretenimiento',
  'Jeux vidéo': 'Entretenimiento',
  'Videojuegos': 'Entretenimiento',
  'Spectacles': 'Entretenimiento',
  'Espectáculos': 'Entretenimiento',
  'People': 'Entretenimiento',
  'Famosos': 'Entretenimiento',
  'Cuisine': 'Entretenimiento',
  'Cocina': 'Entretenimiento',
  'Mode': 'Entretenimiento',
  'Moda': 'Entretenimiento',
  
  // === CATEGORÍAS GENERALES ===
  'Culture générale': 'Historia', // Se distribuye según tema
  'Cultura General': 'Historia'
};

/**
 * Categoriza una pregunta basándose en su tema
 * @param {String} theme - Tema de la pregunta
 * @returns {String} - Categoría del Trivial (Geografia, Historia, Arte, Ciencia, Deportes, Entretenimiento)
 */
function categorizeByTheme(theme) {
  if (!theme) return 'Historia';
  
  const themeStr = theme.toLowerCase();
  
  // GEOGRAFÍA
  if (themeStr.match(/(geograf|país|ciudad|región|continen|ocean|mar|río|montaña|capital|lugar|territori|bretaña|bretagne|francia|españa|europa|asia|áfrica|américa|périgord|auroville)/i)) {
    return 'Geografia';
  }
  
  // CIENCIA Y NATURALEZA
  if (themeStr.match(/(ciencia|biolog|físic|químic|matemática|astronomía|tecnología|informática|comput|microsoft|apple|google|internet|software|animal|natura|planeta|espacio|medicina|salud|volcán|volcans|forêt|magnésium|cactus|crypto)/i)) {
    return 'Ciencia';
  }
  
  // DEPORTES
  if (themeStr.match(/(deport|fútbol|baloncesto|tenis|golf|olimp|atleta|campeón|copa|liga|equipo|pyeongchang|escalad)/i)) {
    return 'Deportes';
  }
  
  // ARTE Y CULTURA
  if (themeStr.match(/(arte|pintura|escultura|literatura|libro|novela|poesía|música|músico|cantante|compositor|piano|guitarra|orquesta|ópera|ballet|danza|teatro|céramique|poterie|prénoms célèbres)/i)) {
    return 'Arte';
  }
  
  // ENTRETENIMIENTO (Cine, TV, Series, Celebridades, Moda, Cocina, Videojuegos)
  if (themeStr.match(/(cine|cinéma|película|film|actor|actriz|director|serie|séries|star trek|televisión|tv|espectáculo|famoso|celebr|stars|césar|people|videojuego|juego|playstation|cocina|gastronom|vino|receta|moda|mode|maquillage|déjeuner|gin|coca-cola|super-héro|gladiateur)/i)) {
    return 'Entretenimiento';
  }
  
  // HISTORIA (Por defecto para cultura general y hechos históricos)
  if (themeStr.match(/(histor|guerra|rey|reina|imperio|batalla|revolución|edad media|antigü|modern|contempor|siglo|época|faits de société|incollable|culture|expressions)/i)) {
    return 'Historia';
  }
  
  // Por defecto Historia (cultura general)
  return 'Historia';
}

/**
 * Convierte una pregunta de formato OpenQuizzDB a nuestro formato
 * @param {Object} oqdbQuestion - Pregunta en formato OpenQuizzDB
 * @param {Number} id - ID único para la pregunta
 * @returns {Object} Pregunta en nuestro formato
 */
function convertQuestion(oqdbQuestion, id) {
  // IMPORTANTE: En formato JSON de OpenQuizzDB, las opciones YA vienen mezcladas
  // según su documentación: "les propositions de réponse sont ici volontairement mélangées"
  // Por lo tanto, NO las mezclamos de nuevo
  
  // El formato puede ser:
  // 1. Formato con reponse_correcte y autres_choix (formato antiguo)
  // 2. Formato con propositions y réponse (formato actual)
  
  let options, correctAnswerIndex;
  
  if (oqdbQuestion.propositions && oqdbQuestion.réponse) {
    // Formato actual: propositions (array) y réponse (string)
    options = oqdbQuestion.propositions;
    correctAnswerIndex = options.indexOf(oqdbQuestion.réponse);
    
    if (correctAnswerIndex === -1) {
      console.warn(`No se encontró la respuesta correcta: ${oqdbQuestion.réponse}`);
      correctAnswerIndex = 0;
    }
  } else if (oqdbQuestion.reponse_correcte && oqdbQuestion.autres_choix) {
    // Formato antiguo
    options = [
      oqdbQuestion.reponse_correcte,
      ...oqdbQuestion.autres_choix
    ];
    correctAnswerIndex = 0;
  } else {
    // Formato desconocido
    console.warn('Formato de pregunta desconocido:', oqdbQuestion);
    return null;
  }
  
  // Mapear categoría
  let category = 'Historia'; // Por defecto
  
  // Primero intentar con el campo categorie
  if (oqdbQuestion.categorie) {
    category = CATEGORY_MAP[oqdbQuestion.categorie] || oqdbQuestion.categorie;
  } 
  // Si no hay categorie, intentar categorizar por tema
  else if (oqdbQuestion.theme) {
    category = categorizeByTheme(oqdbQuestion.theme);
  }
  
  // Mapear dificultad (puede no existir)
  let difficulty = 'medium';
  if (oqdbQuestion.difficulte) {
    difficulty = DIFFICULTY_MAP[oqdbQuestion.difficulte] || 'medium';
  }
  
  return {
    id: id,
    category: category,
    question: oqdbQuestion.question,
    options: options, // Ya vienen mezcladas desde OpenQuizzDB (formato JSON)
    correctAnswer: correctAnswerIndex,
    difficulty: difficulty,
    anecdote: oqdbQuestion.anecdote || null,
    wikipedia: oqdbQuestion.wikipédia || null,
    theme: oqdbQuestion.theme || null,
    source: 'OpenQuizzDB',
    author: oqdbQuestion.rédacteur || 'OpenQuizzDB'
  };
}

/**
 * Convierte un array de preguntas de OpenQuizzDB
 * @param {Array} oqdbQuestions - Array de preguntas OpenQuizzDB
 * @param {Number} startId - ID inicial para las preguntas
 * @returns {Array} Array de preguntas en nuestro formato
 */
function convertQuestions(oqdbQuestions, startId = 1) {
  return oqdbQuestions
    .map((q, index) => convertQuestion(q, startId + index))
    .filter(q => q !== null); // Filtrar preguntas inválidas
}

/**
 * Filtra preguntas por categoría
 * @param {Array} questions - Array de preguntas
 * @param {String} category - Categoría a filtrar
 * @returns {Array} Preguntas filtradas
 */
function filterByCategory(questions, category) {
  return questions.filter(q => q.category === category);
}

/**
 * Filtra preguntas por dificultad
 * @param {Array} questions - Array de preguntas
 * @param {String} difficulty - Dificultad (easy, medium, hard)
 * @returns {Array} Preguntas filtradas
 */
function filterByDifficulty(questions, difficulty) {
  return questions.filter(q => q.difficulty === difficulty);
}

/**
 * Obtiene estadísticas de las preguntas
 * @param {Array} questions - Array de preguntas
 * @returns {Object} Estadísticas
 */
function getStats(questions) {
  const stats = {
    total: questions.length,
    byCategory: {},
    byDifficulty: {},
    withAnecdotes: 0,
    withWikipedia: 0
  };
  
  questions.forEach(q => {
    // Por categoría
    stats.byCategory[q.category] = (stats.byCategory[q.category] || 0) + 1;
    
    // Por dificultad
    stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
    
    // Con anécdotas
    if (q.anecdote) stats.withAnecdotes++;
    
    // Con Wikipedia
    if (q.wikipedia) stats.withWikipedia++;
  });
  
  return stats;
}

module.exports = {
  convertQuestion,
  convertQuestions,
  filterByCategory,
  filterByDifficulty,
  getStats,
  CATEGORY_MAP,
  DIFFICULTY_MAP
};
/**
 * Mezcla un array aleatoriamente (Fisher-Yates shuffle)
 * @param {Array} array - Array a mezclar
 * @returns {Array} Array mezclado
 * @note No se usa para OpenQuizzDB JSON (ya vienen mezcladas)
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

module.exports = {
  convertQuestion,
  convertQuestions,
  filterByCategory,
  filterByDifficulty,
  getStats,
  shuffleArray // Por si se necesita para otros formatos
};