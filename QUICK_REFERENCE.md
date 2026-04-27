# 🔧 Referencia Rápida - Endpoints y Eventos

## 📋 Endpoints Nuevos

```
POST /api/games/:gameCode/pause
POST /api/games/:gameCode/resume
POST /api/games/:gameCode/leave
POST /api/games/:gameCode/end
```

---

## 🎯 Matriz de Permisos

| Endpoint | Host | Jugador | Notas |
|----------|------|---------|-------|
| `pause` | ✅ | ❌ | Solo pausar en `playing` |
| `resume` | ✅ | ❌ | Solo reanudar en `paused` |
| `leave` | ✅ | ✅ | Cualquiera, cualquier momento |
| `end` | ✅ | ❌ | Termina para todos |

---

## 🔊 Eventos Socket.IO

```javascript
// Escuchar (client-side)
socket.on('gamePaused', (data))    // { pausedBy, pausedAt }
socket.on('gameResumed', (data))   // { resumedBy, turnPlayer }
socket.on('gameEnded', (data))     // { reason }
socket.on('playerLeft', (data))    // { playerName, players[] }
```

---

## 📦 Request/Response Body

```javascript
// TODOS usan el mismo formato
{
  "playerName": "Juan"  // Quien realiza la acción
}
```

---

## ✅ Success Response

```json
{
  "success": true
}
```

---

## ❌ Error Responses

```json
// 404
{ "success": false, "message": "Partida no encontrada" }

// 403
{ "success": false, "message": "Solo el anfitrión puede [acción]" }

// 400
{ "success": false, "message": "La partida no está en [estado requerido]" }
```

---

## 🔄 Estados y Transiciones

```
waiting     ← Inicial
  ↓
playing     ← Después de startGame
  ↓
paused      ← Con endpoint /pause
  ↓
playing     ← Con endpoint /resume
  ↓
finished    ← Con endpoint /end O ganador
```

---

## 💾 Persistencia

- **Archivo:** `backend/data/games.json`
- **Carga:** Al iniciar servidor
- **Expira:** 24 horas
- **Se guarda:** Automáticamente

---

## 📱 Flujos rápidos

### Pausar
```
POST /pause → event gamePaused → UI muestra "Pausada"
```

### Reanudar
```
POST /resume → event gameResumed → UI normal
```

### Abandonar
```
POST /leave → event playerLeft → actualizar jugadores
```

### Terminar
```
POST /end → event gameEnded → volver a home
```

---

## 🧪 Testear endpoints

```bash
# Pausar
curl -X POST http://localhost:3001/api/games/DRAGON42/pause \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Juan"}'

# Reanudar
curl -X POST http://localhost:3001/api/games/DRAGON42/resume \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Juan"}'

# Abandonar
curl -X POST http://localhost:3001/api/games/DRAGON42/leave \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Carlos"}'

# Terminar
curl -X POST http://localhost:3001/api/games/DRAGON42/end \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Juan"}'
```

---

## 🚀 Integración mínima (3 pasos)

### 1. Importar
```javascript
import axios from 'axios'
import io from 'socket.io-client'
```

### 2. Hacer request
```javascript
axios.post(`${API_URL}/api/games/${gameCode}/pause`, 
  { playerName: userName })
```

### 3. Escuchar evento
```javascript
socket.on('gamePaused', () => { /* actualizar UI */ })
```

---

## 📚 Archivos modificados

- `backend/server.js` - Nuevos endpoints + persistencia
- `frontend/src/App.js` - Listeners Socket.IO + funciones
- `frontend/src/components/GameBoard.js` - Botones UI

---

**Versión:** 1.0 | **Fecha:** 27/04/2026 | **Rama:** main
