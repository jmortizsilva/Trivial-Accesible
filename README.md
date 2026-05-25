# Trivial Accesible

Prototipo híbrido físico-digital desarrollado como Trabajo Final de Máster (TFM) del:

Máster de Formación Permanente en Accesibilidad Digital para Educación, Comunicación y Diseño (EARED)  
Universitat de Barcelona

https://eared.org/

## Información académica

- Autor: José María Ortiz Silva
- Tutora académica: Dra. Mireia Ribera Turro

## Descripción del proyecto

Trivial Accesible es una propuesta de sistema de juego accesible orientado a personas ciegas o con deficiencia visual grave, basada en la integración de:

- aplicación accesible;
- tablero táctil;
- interacción tangible;
- y experiencia compartida entre personas con y sin discapacidad visual.

La propuesta combina una arquitectura híbrida físico-digital que permite gestionar el contenido textual mediante una aplicación accesible mientras el tablero físico representa espacialmente la mecánica del juego mediante exploración táctil.

El objetivo principal del proyecto consiste en analizar la viabilidad de modelos de diseño accesible aplicados a juegos de preguntas y respuestas.

## Características principales

- **accesible**: Diseñado para que sea compatible para usuarios de lectores de pantalla (NVDA, JAWS, Narrator, VoiceOver y TalkBack)
- **Dos modos de juego**:
  - **Tablero físico**: Uso de tablero real mientras la aplicación gestiona las preguntas
  - **Tablero digital**: Juego completamente integrado en la aplicación
- **Multijugador en tiempo real** mediante Socket.IO
- **Control completo por teclado** sin necesidad de ratón
- **Sistema de quesitos** inspirado en la dinámica clásica de juegos de preguntas y respuestas por categorías
- **Anuncios automáticos** de eventos relevantes del juego
- **Visualización compartida** de preguntas y progreso de partida
- **Marcador accesible** consultable en cualquier momento

## Características de accesibilidad

### Compatibilidad con lectores de pantalla

- NVDA
- JAWS
- Narrator
- VoiceOver
- TalkBack

### Medidas de accesibilidad implementadas

- Navegación completa mediante teclado
- Etiquetado semántico accesible
- Compatibilidad con tecnologías de apoyo
- Anuncios dinámicos de eventos del juego
- Navegación lineal y estructurada
- Controles estándar accesibles
- Ausencia de dependencias exclusivamente visuales
- Información anticipada sobre movimientos y categorías

## Tecnologías utilizadas

### Backend

- Node.js
- Express
- Socket.IO
- Persistencia en JSON

### Frontend

- React 18
- Socket.IO Client
- Axios
- CSS modular con enfoque en accesibilidad

## Acceso al prototipo

Versión web desplegada:

https://trivial-frontend.render.com

La versión experimental para dispositivos iOS se distribuye mediante TestFlight con fines académicos y de evaluación funcional.

## Categorías de preguntas

1. Geografía
2. Historia
3. Ciencia
4. Arte y Literatura
5. Deportes
6. Entretenimiento

## Funcionamiento general

### Modo tablero físico

1. Configurar tablero, dado y fichas reales
2. Lanzar el dado físico y mover la ficha manualmente
3. Seleccionar en la aplicación la categoría correspondiente
4. Responder la pregunta mostrada por el sistema
5. Gestionar los turnos según las reglas del juego

### Modo digital

1. Lanzar dado virtual
2. Elegir dirección de movimiento
3. Consultar categoría y disponibilidad de quesito
4. Responder la pregunta
5. Continuar turno o cambiar de jugador automáticamente

## 📁 Estructura general del proyecto

```text
trivial-accesible/
├── backend/
├── frontend/
├── README.md
└── DEPLOY.md
```

## Documentación técnica adicional

El repositorio incluye documentación técnica complementaria relacionada con:

- arquitectura del sistema;
- eventos Socket.IO;
- persistencia de sesiones;
- gestión de reconexiones;
- e integración móvil.

## Preguntas y contenido

Las preguntas incluidas actualmente en el prototipo fueron generadas específicamente para la prueba de concepto desarrollada en el marco del TFM.

Debido a la dificultad de localizar bases de datos abiertas en español adecuadas para un sistema accesible de preguntas y respuestas, se generó un conjunto inicial de preguntas utilizando herramientas de inteligencia artificial generativa bajo supervisión y revisión manual del autor.

Estas preguntas tienen exclusivamente fines demostrativos y de validación funcional del sistema, y no constituyen una base de datos definitiva para un producto final.

## Licencia

MIT License.

## Contribuciones

Las contribuciones y sugerencias de mejora son bienvenidas mediante issues o pull requests.

## Contacto

Para consultas relacionadas con el proyecto o el TFM, puede utilizarse el sistema de issues del repositorio.

---

Desarrollado en el marco del Trabajo Final del Máster EARED
