/**
 * Script para convertir SOLO preguntas en ESPAÑOL de OpenQuizzDB
 * Este script filtra y procesa únicamente las preguntas en español
 * Uso: node utils/convert-spanish-only.js
 */

const fs = require('fs');
const path = require('path');
const adapter = require('./openquizzdb-adapter');

// Directorios
const OPENQUIZZDB_DIR = path.join(__dirname, '../data/openquizzdb');
const OUTPUT_FILE = path.join(__dirname, '../data/questions.json');
const BACKUP_FILE = path.join(__dirname, '../data/questions.backup.json');

/**
 * Lee solo las secciones en español de los archivos JSON
 */
function readSpanishQuestions(directory) {
  const allQuestions = [];
  
  if (!fs.existsSync(directory)) {
    console.log(`❌ Directorio no encontrado: ${directory}`);
    return allQuestions;
  }
  
  const files = fs.readdirSync(directory);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  console.log(`\n📂 Procesando ${jsonFiles.length} archivos JSON...`);
  
  let filesWithSpanish = 0;
  
  jsonFiles.forEach(file => {
    const filePath = path.join(directory, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar si el archivo contiene la clave "es" para español
    if (!content.includes('"es"')) {
      return; // Saltar este archivo
    }
    
    filesWithSpanish++;
    
    // Limpiar el JSON (OpenQuizzDB tiene formato inválido con divisiones)
    content = content.replace(/(\d+)\s*\/\s*(\d+)/g, '$1');
    
    try {
      const data = JSON.parse(content);
      const quizzData = data.quizz || data;
      const theme = data['thème'] || data.theme || null;
      
      // Buscar la sección en español con la clave "es"
      let spanishQuestions = [];
      
      // Buscar por la clave "es"
      if (quizzData.es) {
        const esData = quizzData.es;
        
        // Puede ser un array directo o un objeto con niveles
        if (Array.isArray(esData)) {
          spanishQuestions = esData;
        } else if (typeof esData === 'object') {
          // Tiene un nivel adicional (ej: [{débutant: [...], confirmé: [...], expert: [...]}])
          if (Array.isArray(esData) && esData.length > 0 && typeof esData[0] === 'object') {
            esData.forEach(levelGroup => {
              Object.values(levelGroup).forEach(level => {
                if (Array.isArray(level)) {
                  spanishQuestions.push(...level);
                }
              });
            });
          } else {
            // Es un objeto simple con niveles
            Object.values(esData).forEach(level => {
              if (Array.isArray(level)) {
                spanishQuestions.push(...level);
              }
            });
          }
        }
      }
      
      if (spanishQuestions.length > 0) {
        // Agregar el tema a cada pregunta
        spanishQuestions.forEach(q => {
          if (!q.theme && theme) {
            q.theme = theme;
          }
        });
        
        console.log(`  ✓ ${file}: ${spanishQuestions.length} preguntas en español`);
        allQuestions.push(...spanishQuestions);
      }
      
    } catch (error) {
      console.log(`  ⚠ ${file}: Error al parsear - ${error.message}`);
    }
  });
  
  console.log(`\n📊 Archivos con español: ${filesWithSpanish} de ${jsonFiles.length}`);
  return allQuestions;
}

/**
 * Script principal
 */
function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🇪🇸 Conversión de OpenQuizzDB - SOLO ESPAÑOL');
  console.log('═══════════════════════════════════════════════════');
  
  // Leer preguntas en español
  const rawQuestions = readSpanishQuestions(OPENQUIZZDB_DIR);
  
  if (rawQuestions.length === 0) {
    console.log('\n❌ No se encontraron preguntas en español');
    console.log('💡 Asegúrate de haber descargado archivos JSON con contenido en español');
    return;
  }
  
  console.log(`\n📝 Total de preguntas en español encontradas: ${rawQuestions.length}`);
  
  // Convertir al formato del juego
  console.log('\n🔄 Convirtiendo formato...');
  const convertedQuestions = adapter.convertQuestions(rawQuestions);
  
  console.log(`✓ Preguntas convertidas: ${convertedQuestions.length}`);
  
  // Filtrar preguntas válidas
  const validQuestions = convertedQuestions.filter(q => 
    q && 
    q.question && 
    q.options && 
    q.options.length === 4 && 
    q.correctAnswer
  );
  
  console.log(`✓ Preguntas válidas: ${validQuestions.length}`);
  
  // Crear backup si existe el archivo
  if (fs.existsSync(OUTPUT_FILE)) {
    console.log(`\n💾 Creando backup: ${path.basename(BACKUP_FILE)}`);
    fs.copyFileSync(OUTPUT_FILE, BACKUP_FILE);
  }
  
  // Guardar preguntas con codificación UTF-8
  console.log(`\n💾 Guardando en: ${path.basename(OUTPUT_FILE)}`);
  const jsonContent = JSON.stringify(validQuestions, null, 2);
  fs.writeFileSync(OUTPUT_FILE, jsonContent, { encoding: 'utf8' });
  
  // Estadísticas
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 ESTADÍSTICAS');
  console.log('═══════════════════════════════════════════════════');
  
  const stats = adapter.getStats(validQuestions);
  
  console.log('\n📚 Por categoría:');
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });
  
  console.log('\n⚡ Por dificultad:');
  Object.entries(stats.byDifficulty).forEach(([diff, count]) => {
    console.log(`  ${diff}: ${count}`);
  });
  
  console.log(`\n📖 Con anécdotas: ${stats.withAnecdotes}`);
  console.log(`🔗 Con Wikipedia: ${stats.withWikipedia}`);
  
  console.log('\n✅ ¡Conversión completada!');
  console.log(`📁 Archivo generado: ${OUTPUT_FILE}`);
  console.log(`🎮 Listo para jugar con ${validQuestions.length} preguntas en español\n`);
}

// Ejecutar
main();
