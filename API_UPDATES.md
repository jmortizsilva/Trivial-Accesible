# 📱 Actualización de API - Pausa, Reanuda y Control de Partidas

**Fecha:** 27 de Abril de 2026  
**Rama:** `main`  
**Cambios:** Nuevos endpoints para pausar/reanudar partidas + persistencia de sesiones

---

## 🎯 Resumen de Cambios

Se han agregado **4 nuevos endpoints REST** y **4 nuevos eventos Socket.IO** para permitir:
- ⏸️ **Pausar partidas** (solo el host)
- ▶️ **Reanudar partidas** (solo el host)
- 🚪 **Abandonar partidas** (cualquier jugador)
- 🛑 **Terminar partidas** (solo el host)
- 💾 **Persistencia automática** en JSON (24h de expiración)

---

## 🔌 Nuevos Endpoints

### 1️⃣ **POST `/api/games/:gameCode/pause`**

**Pausa una partida en curso.**

**Autenticación:**
- Solo el **host** puede pausar
- Requiere parámetro `playerName` que coincida con `game.host`

**Request:**
```json
{
  "playerName": "Juan"
}
```

**Response (200 - OK):**
```json
{
  "success": true
}
```

**Errores:**
```json
// 404 - Partida no encontrada
{ "success": false, "message": "Partida no encontrada" }

// 403 - No eres el host
{ "success": false, "message": "Solo el anfitrión puede pausar la partida" }

// 400 - Partida no está en juego
{ "success": false, "message": "La partida no está en juego" }
```

**Estado actualizado:**
```javascript
game.status = 'paused'
game.pausedAt = new Date()  // Timestamp de cuándo se pausó
game.pausedBy = playerName
```

**Socket.IO Event emitido:**
```javascript
io.to(gameCode).emit('gamePaused', {
  pausedBy: playerName,
  pausedAt: game.pausedAt
})
```

---

### 2️⃣ **POST `/api/games/:gameCode/resume`**

**Reanuda una partida pausada.**

**Autenticación:**
- Solo el **host** puede reanudar
- Requiere que la partida esté en estado `'paused'`

**Request:**
```json
{
  "playerName": "Juan"
}
```

**Response (200 - OK):**
```json
{
  "success": true
}
```

**Errores:**
```json
// 403 - No eres el host
{ "success": false, "message": "Solo el anfitrión puede reanudar la partida" }

// 400 - Partida no está pausada
{ "success": false, "message": "La partida no está pausada" }
```

**Estado actualizado:**
```javascript
game.status = 'playing'
delete game.pausedAt
delete game.pausedBy
```

**Socket.IO Event emitido:**
```javascript
io.to(gameCode).emit('gameResumed', {
  resumedBy: playerName,
  turnPlayer: game.turnPlayer
})
```

---

### 3️⃣ **POST `/api/games/:gameCode/leave`**

**Abandona la partida (cualquier jugador).**

**Autenticación:**
- Cualquier jugador puede abandonar
- No requiere permisos especiales

**Request:**
```json
{
  "playerName": "Carlos"
}
```

**Response (200 - OK):**
```json
{
  "success": true
}
```

**Errores:**
```json
// 404 - Partida no encontrada
{ "success": false, "message": "Partida no encontrada" }

// 404 - Jugador no está en la partida
{ "success": false, "message": "Jugador no encontrado en la partida" }
```

**Lógica especial:**
- Si era **su turno**, el turno pasa automáticamente al siguiente jugador
- Si es el **último jugador**, la partida se elimina completamente
- Se emite `turnChanged` si era su turno

**Socket.IO Event emitido:**
```javascript
io.to(gameCode).emit('playerLeft', {
  playerName,
  players: game.players  // Lista actualizada
})
```

---

### 4️⃣ **POST `/api/games/:gameCode/end`**

**Termina la partida completamente (solo host).**

**Autenticación:**
- Solo el **host** puede terminar
- Termina la partida para **todos** los jugadores

**Request:**
```json
{
  "playerName": "Juan"
}
```

**Response (200 - OK):**
```json
{
  "success": true
}
```

**Errores:**
```json
// 403 - No eres el host
{ "success": false, "message": "Solo el anfitrión puede terminar la partida" }
```

**Acción:**
- Marca `game.status = 'finished'`
- Borra la partida del servidor
- Notifica a todos los jugadores

**Socket.IO Event emitido:**
```javascript
io.to(gameCode).emit('gameEnded', {
  reason: 'El anfitrión ha terminado la partida'
})
```

---

## 🔊 Nuevos Eventos Socket.IO

### **Client escucha estos eventos:**

#### `gamePaused`
```javascript
socket.on('gamePaused', (data) => {
  console.log(`Partida pausada por: ${data.pausedBy}`)
  console.log(`Hora: ${data.pausedAt}`)
  // Mostrar UI de pausa
})
```

#### `gameResumed`
```javascript
socket.on('gameResumed', (data) => {
  console.log(`Partida reanudada por: ${data.resumedBy}`)
  console.log(`Es el turno de: ${data.turnPlayer}`)
  // Ocultar UI de pausa
})
```

#### `gameEnded`
```javascript
socket.on('gameEnded', (data) => {
  console.log(`Razón: ${data.reason}`)
  // Redirigir a home o mostrar pantalla de fin
})
```

#### `playerLeft`
```javascript
socket.on('playerLeft', (data) => {
  console.log(`${data.playerName} ha abandonado`)
  console.log(`Jugadores restantes: ${data.players.length}`)
  // Actualizar lista de jugadores
})
```

---

## 💾 Persistencia de Sesiones

### ✨ Características

- **Archivo:** `backend/data/games.json`
- **Guardado automático** después de: create, pause, resume, leave, end
- **Carga automática** al iniciar el servidor
- **Expiración:** 24 horas (partidas antiguas se descartan)
- **Limpieza:** Automática al reiniciar el servidor

### 📋 Formato de archivo

```json
[
  {
    "code": "DRAGON42",
    "game": {
      "id": "uuid-123",
      "code": "DRAGON42",
      "host": "Juan",
      "mode": "digital",
      "status": "paused",
      "players": [
        {
          "name": "Juan",
          "score": 150,
          "categories": ["Geografía"],
          "position": 15,
          "wedges": []
        },
        {
          "name": "Carlos",
          "score": 100,
          "categories": [],
          "position": 8,
          "wedges": []
        }
      ],
      "currentTurn": 0,
      "turnPlayer": "Juan",
      "status": "paused",
      "pausedAt": "2026-04-27T10:30:00.000Z",
      "pausedBy": "Juan",
      "createdAt": "2026-04-27T10:25:00.000Z"
    },
    "savedAt": "2026-04-27T10:30:00.000Z"
  }
]
```

---

## 📱 Guía para App Móvil

### Flujo: Pausar y Reanudar

```javascript
// 1. Pausar
axios.post(`${API_URL}/api/games/${gameCode}/pause`, {
  playerName: userName
})
.then(() => {
  // Mostrar pantalla de "Partida pausada"
  showPauseScreen()
})

// 2. Escuchar evento de pausa
socket.on('gamePaused', (data) => {
  // UI reactiva: mostrar overlay de pausa
  updateGameStatus('paused')
})

// 3. Reanudar
axios.post(`${API_URL}/api/games/${gameCode}/resume`, {
  playerName: userName
})
.then(() => {
  // Volver a juego normal
  hidePauseScreen()
})

// 4. Escuchar evento de reanuda
socket.on('gameResumed', (data) => {
  // UI reactiva: volver al estado de juego
  updateGameStatus('playing')
})
```

### Flujo: Abandonar Partida

```javascript
// 1. Usuario toca "Abandonar"
axios.post(`${API_URL}/api/games/${gameCode}/leave`, {
  playerName: userName
})
.then(() => {
  // Volver a home/lobby
  navigation.navigate('Home')
})

// 2. Otros jugadores reciben notificación
socket.on('playerLeft', (data) => {
  console.log(`${data.playerName} se fue`)
  updatePlayerList(data.players)
  
  // Si era el turno del que se fue, puede haber turnChanged
})
```

### Flujo: Terminar Partida (Host)

```javascript
// 1. Solo host puede terminar
if (isHost) {
  axios.post(`${API_URL}/api/games/${gameCode}/end`, {
    playerName: userName
  })
  .then(() => {
    // Host se va a home
    navigation.navigate('Home')
  })
}

// 2. Todos reciben gameEnded
socket.on('gameEnded', (data) => {
  showAlert('Partida terminada: ' + data.reason)
  setTimeout(() => navigation.navigate('Home'), 2000)
})
```

---

## 🔄 Manejo de Desconexiones (Importante para Móvil)

### ¿Qué pasa si la app se cierra?

1. **Socket se desconecta** pero la partida permanece en el servidor (guardada)
2. **Cuando reabre la app**, puede hacer `joinGame` con el mismo código
3. **Si estaba pausada**, la verá pausada
4. **Si era su turno**, seguirá siendo su turno

```javascript
// Al reabrir la app
socket.connect()
socket.emit('joinGame', gameCode)

// Obtener estado actual
axios.get(`${API_URL}/api/games/${gameCode}`)
.then(response => {
  const game = response.data.game
  
  if (game.status === 'paused') {
    // Mostrar "Partida pausada - ¿Reanudar?"
  } else if (game.status === 'playing') {
    // Volver a juego normal
  }
})
```

---

## 🧪 Ejemplos de Uso Completo

### React Native / Swift / TypeScript

```javascript
// PAUSAR
const pauseGame = async () => {
  try {
    const response = await fetch(`${API_URL}/api/games/${gameCode}/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: userName })
    })
    const data = await response.json()
    if (data.success) {
      setGameStatus('paused')
      showNotification('Partida pausada')
    }
  } catch (error) {
    showError(error.message)
  }
}

// REANUDAR
const resumeGame = async () => {
  try {
    const response = await fetch(`${API_URL}/api/games/${gameCode}/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: userName })
    })
    const data = await response.json()
    if (data.success) {
      setGameStatus('playing')
      showNotification('Partida reanudada')
    }
  } catch (error) {
    showError(error.message)
  }
}

// ABANDONAR
const leaveGame = async () => {
  try {
    await fetch(`${API_URL}/api/games/${gameCode}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: userName })
    })
    navigation.navigate('Home')
  } catch (error) {
    showError(error.message)
  }
}

// ESCUCHAR EVENTOS
useEffect(() => {
  socket.on('gamePaused', () => setGameStatus('paused'))
  socket.on('gameResumed', () => setGameStatus('playing'))
  socket.on('gameEnded', () => navigation.navigate('Home'))
  socket.on('playerLeft', (data) => updatePlayers(data.players))
  
  return () => {
    socket.off('gamePaused')
    socket.off('gameResumed')
    socket.off('gameEnded')
    socket.off('playerLeft')
  }
}, [])
```

---

## 🚀 Backend Cambios

### Nuevas funciones en `backend/server.js`

```javascript
// Guardado automático en JSON
saveGamesToFile()         // Guarda partidas en backend/data/games.json
loadGamesFromFile()       // Carga partidas al iniciar
cleanOldGamesFile()       // Elimina partidas > 24h
```

### Llamadas automáticas

Se guarda automáticamente después de:
- ✅ Crear partida (`/api/games/create`)
- ⏸️ Pausar (`/api/games/:gameCode/pause`)
- ▶️ Reanudar (`/api/games/:gameCode/resume`)
- 🚪 Abandonar (`/api/games/:gameCode/leave`)
- 🛑 Terminar (`/api/games/:gameCode/end`)

---

## 📊 Estados de la Partida

```
waiting → playing → paused ⟷ playing → finished
```

| Estado | Descripción |
|--------|------------|
| `waiting` | Esperando a que empiecen a jugar |
| `playing` | En juego activamente |
| `paused` | En pausa (puede reanudarse) |
| `finished` | Terminada (no puede reanudarse) |

---

## ❓ Preguntas Frecuentes

**P: ¿Cuánto tiempo dura una sesión pausada?**  
R: 24 horas. Después se descarta automáticamente.

**P: ¿Si todos abandonan, qué pasa?**  
R: La partida se elimina inmediatamente.

**P: ¿Puedo abandonar si no es mi turno?**  
R: Sí, cualquiera puede abandonar en cualquier momento.

**P: ¿Si pierdo conexión, ¿se pausa la partida?**  
R: No automáticamente. La partida sigue. Cuando reconectes, verás el estado actual.

**P: ¿El host puede pausar en medio de una pregunta?**  
R: Sí, en cualquier momento.

---

## 🔗 Requisitos de Integración

- **Node.js:** v14+
- **Express:** Ya incluido
- **Socket.IO:** Ya incluido
- **Axios (Frontend):** Ya incluido
- **No se necesitan** librerías nuevas

---

## 📝 Notas

- Todos los cambios están en la rama `main`
- La persistencia es **opcional** pero recomendada para apps móviles
- Los eventos Socket.IO son **en tiempo real**
- Los endpoints son **RESTful** (estándar REST)

---

**¡Listo para integrar en la app móvil!** 🚀
