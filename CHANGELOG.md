# 📝 Changelog - Cambios Específicos

## Backend (`backend/server.js`)

### ✨ Nuevas funciones (líneas ~270-365)

```javascript
// Persistencia de partidas en JSON
const GAMES_FILE = path.join(__dirname, 'data', 'games.json')
const GAME_EXPIRY_TIME = 24 * 60 * 60 * 1000  // 24 horas

function saveGamesToFile()          // Guarda Map a JSON
function loadGamesFromFile()        // Carga JSON a Map
function cleanOldGamesFile()        // Elimina antiguas
```

### 🔌 Nuevos endpoints (líneas ~795-910)

```javascript
// Pausar partida
app.post('/api/games/:gameCode/pause', (req, res) => { ... })

// Reanudar partida
app.post('/api/games/:gameCode/resume', (req, res) => { ... })

// Abandonar partida
app.post('/api/games/:gameCode/leave', (req, res) => { ... })

// Terminar partida
app.post('/api/games/:gameCode/end', (req, res) => { ... })
```

### 🔄 Socket.IO mejorado (líneas ~915-940)

```javascript
// Mantiene conexión socket → partida
if (!game.socketConnections) {
  game.socketConnections = new Map()
}
game.socketConnections.set(socket.id, { gameCode: ... })
```

### 💾 Guardado automático

Agregadas llamadas a `saveGamesToFile()` en:
- Línea ~434: Después de crear partida
- Línea ~820: Después de pausar
- Línea ~840: Después de reanudar
- Línea ~880: Después de abandonar
- Línea ~910: Después de terminar

### 🚀 Startup (línea ~170-171)

```javascript
cleanOldGamesFile()    // Limpia archivo al iniciar
loadGamesFromFile()    // Carga sesiones guardadas
```

---

## Frontend - App.js (`frontend/src/App.js`)

### ✨ Nuevas funciones (líneas ~107-160)

```javascript
const pauseGame = async () => { ... }      // Llama endpoint /pause
const resumeGame = async () => { ... }    // Llama endpoint /resume
const leaveGame = async () => { ... }     // Llama endpoint /leave
const endGame = async () => { ... }       // Llama endpoint /end
```

### 🔊 Nuevos listeners Socket.IO (líneas ~185-225)

```javascript
socket.on('gamePaused', (data) => { ... })
socket.on('gameResumed', (data) => { ... })
socket.on('gameEnded', (data) => { ... })
socket.on('playerLeft', (data) => { ... })
```

### 📤 Props a GameBoard (línea ~365)

```javascript
<GameBoard 
  // ... props anteriores
  onPauseGame={pauseGame}
  onResumeGame={resumeGame}
  onLeaveGame={leaveGame}
  onEndGame={endGame}
/>
```

---

## Frontend - GameBoard.js (`frontend/src/components/GameBoard.js`)

### 🎨 Props actualizadas (línea ~24)

```javascript
function GameBoard({ 
  gameData, 
  playerName, 
  announce, 
  setGameData,
  // NUEVOS:
  onPauseGame, 
  onResumeGame, 
  onLeaveGame, 
  onEndGame 
})
```

### 🎮 UI: Botones de control (líneas ~525-575)

**Vista de categorías:**
```jsx
{gameData.status === 'playing' && (
  <div style={{ ... }}>
    {gameData.host === playerName && (
      <button onClick={onPauseGame}>⏸️ Pausar</button>
    )}
    <button onClick={onLeaveGame}>🚪 Abandonar</button>
    {gameData.host === playerName && (
      <button onClick={onEndGame}>🛑 Terminar</button>
    )}
  </div>
)}
```

### 🎮 UI: Indicador de pausa (líneas ~515-525)

```jsx
{gameData.status === 'paused' && (
  <div className="alert" style={{ ... }}>
    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
      <span aria-hidden="true">⏸️ </span>LA PARTIDA ESTÁ PAUSADA
    </div>
  </div>
)}
```

### 🎮 UI: Botón de reanuda (líneas ~577-595)

```jsx
{gameData.status === 'paused' && gameData.host === playerName && (
  <div style={{ marginBottom: '1.5rem' }}>
    <button onClick={onResumeGame} style={{ ... }}>
      <span aria-hidden="true">▶️ </span>Reanudar Partida
    </button>
  </div>
)}
```

### 🎭 Vista de pregunta: Botones similares (línea ~895-940)

Mismos botones en versión compacta para la vista de pregunta.

---

## 📁 Archivos Nuevos

- `API_UPDATES.md` - Documentación completa (este repo)
- `QUICK_REFERENCE.md` - Referencia rápida (este repo)
- `backend/data/games.json` - Se crea automáticamente al pausar

---

## 🔄 Cambios en estructura de datos

### `game` object

**Nuevos campos opcionales:**
```javascript
game.status = 'paused' | 'playing' | 'waiting' | 'finished'
game.pausedAt = Date       // Cuando se pausó
game.pausedBy = string     // Quién pausó
game.socketConnections = Map  // Tracking de conexiones
```

---

## ⚡ Performance

- Guardado en JSON es **rápido** (milisegundos)
- No requiere base de datos
- Limpieza automática evita archivos grandes
- Compatible con servidores sin persistencia

---

## 🔐 Seguridad

✅ Validación de permisos en todos los endpoints  
✅ Solo host puede pausar/reanudar/terminar  
✅ Cualquiera puede abandonar (privacidad)  
✅ No se exponen datos sensibles en mensajes

---

## 🧪 Testing

Todos los cambios validan con:
```bash
node -c backend/server.js     # ✓
node -c frontend/src/App.js   # ✓
node -c frontend/src/components/GameBoard.js  # ✓
```

---

## 📦 Dependencias

**Ninguna nueva requerida** - Todo usa dependencias existentes:
- Express (ya incluido)
- Socket.IO (ya incluido)
- fs (nativa de Node.js)
- path (nativa de Node.js)

---

## 🚀 Deployment

1. Pull de `main`
2. `npm install` (si hay cambios en package.json - no hay)
3. Reiniciar servidor: `node backend/server.js`
4. Los archivos persistidos en `backend/data/` se cargan automáticamente

---

## ✅ Checklist de Integración Móvil

- [ ] Implementar botones pausa/reanudar
- [ ] Implementar botón abandonar
- [ ] Agregar listeners Socket.IO en app mobile
- [ ] Mostrar indicador visual cuando está pausada
- [ ] Manejar reconexión (detectar pausa al reconectar)
- [ ] Testear con desconexiones de red
- [ ] Validar persistencia en 24h de pausa

---

**Última actualización:** 27/04/2026  
**Versión API:** 1.0  
**Rama:** main
