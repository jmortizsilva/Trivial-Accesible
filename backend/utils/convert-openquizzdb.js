/**
 * Script para convertir preguntas de OpenQuizzDB descargadas
 * IMPORTANTE: Este script REEMPLAZA todas las preguntas existentes
 * Uso: node utils/convert-openquizzdb.js
 */

const fs = require('fs');
const path = require('path');
const adapter = require('./openquizzdb-adapter');

// Directorios
const OPENQUIZZDB_DIR = path.join(__dirname, '../data/openquizzdb');
const OUTPUT_FILE = path.join(__dirname, '../data/questions.json');
const BACKUP_FILE = path.join(__dirname, '../data/questions.backup.json');

/**
 * Lee todos los archivos JSON de un directorio
 */
function readJsonFiles(directory) {
  const allQuestions = [];
  
  if (!fs.existsSync(directory)) {
    console.log(`❌ Directorio no encontrado: ${directory}`);
    console.log(`📁 Crea el directorio y coloca los archivos JSON de OpenQuizzDB ahí`);
    return allQuestions;
  }
  
  const files = fs.readdirSync(directory);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  console.log(`📂 Encontrados ${jsonFiles.length} archivos JSON`);
  
  jsonFiles.forEach(file => {
    const filePath = path.join(directory, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // OpenQuizzDB puede tener diferentes estructuras
    const questions = Array.isArray(data) ? data : data.quizz || [];
    
    console.log(`  ✓ ${file}: ${questions.length} preguntas`);
    allQuestions.push(...questions);
  });
  
  return allQuestions;
}

/**
 * Script principal
 */
function main() {
  console.log('🔄 Iniciando conversión de OpenQuizzDB...\n');
  
  // Crear backup si existe el archivo actual
  if (fs.existsSync(OUTPUT_FILE)) {
    const existingQuestions = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(existingQuestions, null, 2));
    console.log(`💾 Backup creado: ${existingQuestions.length} preguntas guardadas\n`);
  }
  
  // Leer archivos OpenQuizzDB
  const oqdbQuestions = readJsonFiles(OPENQUIZZDB_DIR);
  
  if (oqdbQuestions.length === 0) {
    console.log('\n⚠️  No se encontraron preguntas para convertir');
    console.log('\n📥 Para usar OpenQuizzDB:');
    console.log('1. Visita https://www.openquizzdb.org/listing.php');
    console.log('2. Filtra por idioma "Español (ES)"');
    console.log('3. Descarga las categorías que necesites');
    console.log(`4. Coloca los archivos JSON en: ${OPENQUIZZDB_DIR}`);
    console.log('5. Ejecuta este script nuevamente\n');
    return;
  }
  
  console.log(`\n📊 Total de preguntas a convertir: ${oqdbQuestions.length}`);
  
  // Convertir preguntas
  const convertedQuestions = adapter.convertQuestions(oqdbQuestions);
  
  // Obtener estadísticas
  const stats = adapter.getStats(convertedQuestions);
  
  console.log('\n📈 Estadísticas:');
  console.log(`  Total: ${stats.total} preguntas`);
  console.log('\n  Por categoría:');
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    console.log(`    ${cat}: ${count}`);
  });
  console.log('\n  Por dificultad:');
  Object.entries(stats.byDifficulty).forEach(([diff, count]) => {
    console.log(`    ${diff}: ${count}`);
  });
  console.log(`\n  Con anécdotas: ${stats.withAnecdotes}`);
  console.log(`  Con enlaces Wikipedia: ${stats.withWikipedia}`);
  
  // Guardar archivo convertido
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(convertedQuestions, null, 2));
  
  console.log(`\n✅ Preguntas convertidas guardadas en: ${OUTPUT_FILE}`);
  console.log('\n🎉 ¡Conversión completada!\n');
  
  // Advertencia sobre atribución
  console.log('📝 IMPORTANTE - Atribución requerida:');
  console.log('   Estas preguntas provienen de OpenQuizzDB (openquizzdb.org)');
  console.log('   Licencia: Creative Commons BY-SA 4.0');
  console.log('   Debes mantener la atribución en tu aplicación\n');
}

// Ejecutar script
main();
