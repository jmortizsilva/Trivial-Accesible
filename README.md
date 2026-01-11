# 🎯 Trivial Accesible

Juego de Trivial Pursuit completamente accesible para personas con ceguera y deficiencia visual grave. Implementa las reglas oficiales del Trivial Pursuit con soporte completo para lectores de pantalla.

## ✨ Características

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
- 📖 **Instrucciones en <details>** para no saturar la interfaz

## 🎮 Categorías

1. 🌍 **Geografía** (azul)
2. 📜 **Historia** (amarillo)
3. 🔬 **Ciencia** (verde)
4. 🎨 **Arte** (morado)
5. ⚽ **Deportes** (naranja)
6. 🎬 **Entretenimiento** (rosa)

## 🚀 Instalación Local

### Requisitos Previos

- Node.js 14 o superior
- npm o yarn

### Backend

```bash
cd backend
npm install
node server.js
```

El servidor se iniciará en `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm start
```

La aplicación se abrirá en `http://localhost:3000`

## 🌐 Despliegue en Producción

Ver **[DEPLOY.md](DEPLOY.md)** para guía completa paso a paso.

### Opción Recomendada: Render.com (Gratis)

**Ventajas:**
- ✅ Completamente gratuito
- ✅ Despliegue automático desde GitHub
- ✅ HTTPS incluido
- ✅ Soporte para WebSockets (Socket.IO)
- ✅ Sin tarjeta de crédito requerida

**Resumen de pasos:**

1. Sube tu código a GitHub
2. Crea cuenta en [Render.com](https://render.com)
3. Despliega backend: Web Service con `node server.js`
4. Despliega frontend: Static Site con `npm run build`
5. Configura variable `REACT_APP_API_URL` en frontend

Ver guía detallada en [DEPLOY.md](DEPLOY.md)

### Otras Opciones

- **Railway**: $5/mes, muy fácil
- **Fly.io**: Gratis, muy rápido
- **Netlify + Render**: Frontend en Netlify, backend en Render

## 🎯 Reglas del Juego

### Modo Tablero Físico

1. Usa tu tablero, dado y fichas reales
2. Tira el dado y mueve tu ficha
3. En la app, selecciona la categoría según donde caíste
4. Responde la pregunta
5. Si aciertas: continúa jugando
6. Si fallas: pasa el turno automáticamente

### Modo Digital

1. Haz clic en "🎲 Tirar Dado"
2. **Elige dirección** (horario/antihorario): El sistema te informa dónde caerás con cada opción y **si hay quesitos disponibles**
3. Responde la pregunta de la categoría asignada
4. Si aciertas en casilla de quesito (posiciones 6, 12, 18, 24, 30, 36): ¡ganas el quesito!
5. Completa los 6 quesitos para ganar

## ♿ Accesibilidad

### Para Usuarios Ciegos

- **Navegación completa por teclado**: Todo funciona con Tab + Enter
- **Anuncios automáticos**: El lector de pantalla anuncia todos los eventos
- **Información anticipada**: Antes de elegir dirección, sabes exactamente dónde caerás y si hay quesitos
- **Etiquetas ARIA descriptivas**: Cada botón describe completamente su función
- **Sin barreras visuales**: No hay CAPTCHAs ni elementos que requieran visión
- **Otros jugadores ven preguntas**: Como en el Trivial físico, todos ven la pregunta aunque no sea su turno

### Lectores de Pantalla Compatibles

✅ NVDA (Windows)
✅ JAWS (Windows)
✅ Narrator (Windows)
✅ VoiceOver (macOS/iOS)
✅ TalkBack (Android)
6. 🎬 **Entretenimiento** (Rosa) - Cine, TV, música pop

## 📝 Atribuciones

Este proyecto utiliza preguntas de [OpenQuizzDB](https://www.openquizzdb.org/), una base de datos gratuita de preguntas de quiz bajo licencia [Creative Commons BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/).

## Licencia

MIT
