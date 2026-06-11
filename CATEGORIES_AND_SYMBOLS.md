# Categorías, Colores y Símbolos Táctiles del Trivial Accesible

Documento de referencia para la versión física y digital del Trivial Accesible actualizado al 11/06/2026.

## Estructura de categorías

Cada categoría tiene asociados:
- **Color interior (RGB)**: Color de la figura geométrica/símbolo
- **Color exterior (RGB)**: Color del fondo de la casilla
- **Símbolo táctil**: Forma geométrica para identificación táctil en el tablero físico
- **Emoji**: Representación visual en la interfaz digital

---

## Categorías detalladas

### 1. Deportes y pasatiempos
- **Emoji**: ⚽
- **Color interior**: RGB(242, 145, 66) → #F29142 (Naranja)
- **Color exterior**: RGB(255, 110, 0) → #FF6E00 (Naranja oscuro)
- **Símbolo táctil**: ⭐ **Estrella de 5 puntas**
- **Ubicación en tablero digital**: Segmento 0 (posiciones 0, 6, 12, 18, 24, 30)

### 2. Ciencias y Naturaleza
- **Emoji**: 🔬
- **Color interior**: RGB(0, 152, 70) → #009846 (Verde oscuro)
- **Color exterior**: RGB(0, 255, 0) → #00FF00 (Verde claro/Lima)
- **Símbolo táctil**: 🔺 **Triángulo**
- **Ubicación en tablero digital**: Segmento 1 (posiciones 1, 7, 13, 19, 25, 31)

### 3. Historia
- **Emoji**: 📜
- **Color interior**: RGB(255, 237, 0) → #FFED00 (Amarillo)
- **Color exterior**: RGB(255, 255, 0) → #FFFF00 (Amarillo claro/Limón)
- **Símbolo táctil**: ▭ **Cuadrado**
- **Ubicación en tablero digital**: Segmento 2 (posiciones 2, 8, 14, 20, 26, 32)

### 4. Geografía
- **Emoji**: 🌍
- **Color interior**: RGB(1, 179, 228) → #01B3E4 (Azul cielo)
- **Color exterior**: RGB(0, 255, 255) → #00FFFF (Cian/Azul claro)
- **Símbolo táctil**: ✕ **Aspa (X)**
- **Ubicación en tablero digital**: Segmento 3 (posiciones 3, 9, 15, 21, 27, 33)

### 5. Entretenimiento
- **Emoji**: 🎬
- **Color interior**: RGB(204, 111, 60) → #CC6F3C (Marrón claro)
- **Color exterior**: RGB(167, 95, 74) → #A75F4A (Marrón oscuro)
- **Símbolo táctil**: ▬ **Rectángulo con esquinas redondeadas**
- **Ubicación en tablero digital**: Segmento 4 (posiciones 4, 10, 16, 22, 28, 34)

### 6. Arte y Literatura
- **Emoji**: 🎨
- **Color interior**: RGB(191, 0, 238) → #BF00EE (Violeta)
- **Color exterior**: RGB(255, 0, 128) → #FF0080 (Rosa/Magenta)
- **Símbolo táctil**: ● **Círculo**
- **Ubicación en tablero digital**: Segmento 5 (posiciones 5, 11, 17, 23, 29, 35)

---

## Notas de implementación

### Versión Digital
- Los colores interiores se usan como color de texto en los botones de categorías
- Los colores exteriores se usan como gradiente de fondo en los botones
- Los emojis proporcionan representación visual alternativa
- Archivo de configuración: `frontend/src/components/GameBoard.js` (CATEGORY_STYLES)

### Versión Física
- Los símbolos táctiles deben estar grabados o marcados en el tablero físico
- Los colores deben ser impresos o pintados para facilitar la identificación visual y táctil
- Cada casilla de categoría debe llevar ambos colores (interior y exterior) según especificaciones
- Se recomienda usar texturas diferentes para mayor claridad táctil

### Base de datos
- Todas las preguntas están clasificadas según estas categorías en: `backend/data/preguntas_trivial_accesible_300.json`
- 50 preguntas por categoría (total: 300 preguntas)
- Sistema de sincronización automática entre frontend y backend

---

## Actualización
- **Fecha**: 11/06/2026
- **Razón**: Actualización de identidad visual y especificación de símbolos táctiles para tablero físico
- **Cambios realizados**:
  - Cambio de nombre: "Ciencia" → "Ciencias y Naturaleza"
  - Cambio de nombre: "Deportes" → "Deportes y pasatiempos"
  - Actualización de capitalización: "Arte y literatura" → "Arte y Literatura"
  - Revisión completa de colores RGB e introducción de especificaciones de símbolos táctiles

---

## Validación técnica

- [x] Frontend actualizado con nuevos colores y nombres
- [x] Backend JSON sincronizado (300 preguntas)
- [x] Build de React regenerado
- [x] Documentación actualizada
