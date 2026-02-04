# 🎯 Trivial Accesible

Juego de Trivial Pursuit completamente accesible para personas con ceguera y deficiencia visual grave. Implementa las reglas oficiales del Trivial Pursuit con soporte completo para lectores de pantalla.

## 🌟 Características Principales

- 🦯 **100% Accesible**: Diseñado específicamente para usuarios de lectores de pantalla (NVDA, JAWS, Narrator, VoiceOver)
- 🎲 **Dos modos de juego**:
  - **Tablero Físico**: Usa tu tablero real y la app solo hace las preguntas
  - **Tablero Digital**: Juega completamente en la aplicación con dado virtual y movimiento automático
- 🌍 **1901 preguntas en español** con anécdotas educativas
- 📱 **Multijugador en tiempo real** usando Socket.IO
- ⌨️ **Control total por teclado** sin necesidad de ratón
- 🎯 **Sistema de quesitos** según reglas oficiales de Trivial Pursuit
- 🔊 **Anuncios automáticos** de todos los eventos importantes
- 👁️ **Otros jugadores ven las preguntas** como en el Trivial real
- 📊 **Marcador colapsable** para consultar cuando quieras

## 🛠️ Tecnologías

### Backend
- Node.js + Express
- Socket.IO para tiempo real
- CORS configurado

### Frontend
- React 18
- Socket.IO Client
- Axios
- CSS modular con enfoque en accesibilidad

## 🎮 Categorías de Preguntas

1. 🌍 **Geografía** (Azul)
2. 📜 **Historia** (Amarillo)
3. 🔬 **Ciencia** (Verde)
4. 🎨 **Arte y Literatura** (Morado)
5. ⚽ **Deportes** (Naranja)
6. 🎬 **Entretenimiento** (Rosa)

## 🚀 Instalación y Uso Local

### Requisitos Previos
- Node.js 14 o superior
- npm (incluido con Node.js)

### 1. Instalar Backend

```bash
cd backend
npm install
npm start
```

El servidor arrancará en `http://localhost:3001`

### 2. Instalar Frontend

```bash
cd frontend
npm install
npm start
```

La aplicación se abrirá automáticamente en `http://localhost:3000`

## 🎯 Cómo Jugar

### Modo Tablero Físico

1. Configura tu tablero, dado y fichas reales
2. Tira el dado y mueve tu ficha físicamente
3. En la aplicación, selecciona la categoría según tu casilla
4. Responde la pregunta
5. Si aciertas → continúa jugando
6. Si fallas → pasa turno automáticamente

### Modo Digital

1. Click en **"🎲 Tirar Dado"**
2. **Elige dirección** (horario/antihorario)
   - El sistema indica dónde caerás con cada opción
   - Te avisa si hay quesitos disponibles
3. Responde la pregunta
4. Si aciertas en casilla de quesito → ¡ganas el quesito!
5. Primer jugador en completar los 6 quesitos gana

### Casillas de Quesito
Posiciones: 6, 12, 18, 24, 30, 36

## ♿ Características de Accesibilidad

### Optimizado para Lectores de Pantalla

- ✅ **Navegación completa por teclado**: Tab + Enter para todas las acciones
- ✅ **Anuncios automáticos**: Notificaciones de todos los eventos del juego
- ✅ **Información anticipada**: Conoce el destino y disponibilidad de quesitos antes de mover
- ✅ **Etiquetas ARIA descriptivas**: Botones con descripciones completas
- ✅ **Sin barreras visuales**: No requiere visión para jugar
- ✅ **Modo espectador**: Otros jugadores ven las preguntas en pantalla

### Lectores de Pantalla Compatibles

- NVDA (Windows)
- JAWS (Windows)
- Narrator (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

## 📁 Estructura del Proyecto

```
trivial-accesible/
├── backend/
│   ├── server.js           # Servidor Express + Socket.IO
│   ├── data/
│   │   ├── questions.json  # Base de datos de preguntas
│   │   └── openquizzdb/    # Preguntas originales de OpenQuizzDB
│   └── utils/              # Utilidades de conversión
│
├── frontend/
│   ├── public/
│   │   └── index.html      # HTML base
│   └── src/
│       ├── App.js          # Componente principal
│       ├── components/     # Componentes React
│       └── index.css       # Estilos accesibles
│
├── README.md               # Este archivo
└── DEPLOY.md              # Guía de despliegue
```

## 🌐 Despliegue en Producción

Para desplegar esta aplicación en la nube de forma gratuita, consulta la [Guía de Despliegue](DEPLOY.md).

### Opciones Recomendadas:

1. **Render.com** (Gratis) - Recomendado
   - WebSockets incluidos
   - Despliegue automático desde GitHub
   - HTTPS gratis

2. **Railway** ($5/mes)
   - Muy fácil de configurar
   - Despliegue rápido

3. **Fly.io** (Gratis)
   - Muy rápido
   - Mayor complejidad

Ver [DEPLOY.md](DEPLOY.md) para instrucciones detalladas paso a paso.

## 📝 Créditos y Licencia

### Preguntas

Las preguntas de este proyecto provienen de [OpenQuizzDB](https://www.openquizzdb.org/), una base de datos gratuita y abierta bajo licencia [Creative Commons BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/).

Se han adaptado y traducido al español 1901 preguntas distribuidas en las 6 categorías del Trivial clásico.

### Licencia del Proyecto

MIT License - Libre para uso, modificación y distribución.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Contacto

Para reportar problemas o sugerir mejoras, abre un issue en el repositorio de GitHub.

---

Desarrollado con ♿ pensando en la accesibilidad universal
