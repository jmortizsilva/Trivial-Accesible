# 🚀 Guía de Despliegue Paso a Paso

## Opción 1: Render.com (RECOMENDADO) ⭐

### ¿Por qué Render?
- ✅ **Completamente GRATIS** sin tarjeta de crédito
- ✅ **WebSockets incluidos** (necesario para Socket.IO)
- ✅ **Despliegue automático** desde GitHub
- ✅ **HTTPS gratis**
- ✅ **Sin límites estrictos** en el plan gratuito

### Paso 1: Preparar GitHub

```bash
cd "c:\Users\jmortizsilva\OneDrive\Pruebas VS code\Trivial"

# Inicializar git (si no está ya)
git init

# Añadir archivos
git add .

# Hacer commit
git commit -m "Trivial accesible - Primera versión"

# Crear repositorio en GitHub (ir a github.com y crear repo "trivial-accesible")

# Conectar y subir
git remote add origin https://github.com/TU_USUARIO/trivial-accesible.git
git branch -M main
git push -u origin main
```

### Paso 2: Desplegar Backend en Render

1. Ve a [render.com](https://render.com) y crea cuenta (gratis)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Configuración:
   ```
   Name: trivial-backend
   Environment: Node
   Region: Frankfurt (más cercano a España)
   Branch: main
   Root Directory: backend
   Build Command: npm install
   Start Command: node server.js
   Plan: Free
   ```
5. Click **"Create Web Service"**
6. Espera a que termine el despliegue (2-3 minutos)
7. **Copia la URL** que te da (ej: `https://trivial-backend.onrender.com`)

### Paso 3: Desplegar Frontend en Render

1. Click en **"New +"** → **"Static Site"**
2. Conecta el mismo repositorio
3. Configuración:
   ```
   Name: trivial-frontend
   Branch: main
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: build
   ```
4. **Añadir variable de entorno**:
   - Click en "Advanced"
   - Add Environment Variable:
     - Key: `REACT_APP_API_URL`
     - Value: `https://trivial-backend.onrender.com` (la URL del backend)
5. Click **"Create Static Site"**
6. Espera a que termine (3-5 minutos)
7. **¡Listo!** Tu URL será algo como: `https://trivial-frontend.onrender.com`

### ⚠️ Nota Importante sobre Render Free Tier

El plan gratuito "duerme" después de 15 minutos de inactividad. La primera petición tras despertar tarda 30-60 segundos. Para evitarlo:

**Opción A - Usar un servicio de ping**:
1. Ve a [cron-job.org](https://cron-job.org) (gratis)
2. Crea un job que haga ping a tu backend cada 10 minutos
3. URL: `https://trivial-backend.onrender.com`

**Opción B - Upgrade a plan pagado**:
- $7/mes por servicio (backend) para mantenerlo siempre activo

---

## Opción 2: Railway.app 🚂

### ¿Por qué Railway?
- ✅ $5 de crédito gratis mensual
- ✅ Muy fácil de usar
- ✅ Despliegue más rápido

### Pasos:

1. Ve a [railway.app](https://railway.app)
2. Crea cuenta con GitHub
3. **"New Project"** → **"Deploy from GitHub repo"**
4. Selecciona tu repositorio `trivial-accesible`
5. Railway detecta automáticamente Node.js
6. Se despliega todo automáticamente
7. Configura dominios en la pestaña "Settings"

**Nota**: Con $5 gratis tienes ~500 horas/mes de uso.

---

## Opción 3: Netlify + Render 🔷

### Frontend en Netlify (más rápido)

1. Ve a [netlify.com](https://netlify.com)
2. Arrastra la carpeta `frontend/build` O conecta GitHub
3. Configuración:
   ```
   Build command: npm install && npm run build
   Publish directory: build
   Base directory: frontend
   ```
4. Añade variable: `REACT_APP_API_URL` con tu backend de Render

### Backend en Render (como arriba)

---

## Opción 4: Fly.io 🪰

### ¿Por qué Fly.io?
- ✅ Gratis hasta 3 apps
- ✅ Muy rápido (edge computing)
- ✅ Ubicación global

### Pasos:

```bash
# Instalar CLI
npm install -g flyctl

# Login
flyctl auth login

# Crear app backend
cd backend
flyctl launch
# Seguir el wizard, elegir región Frankfurt

# Crear app frontend
cd ../frontend
flyctl launch

# Configurar variable de entorno en frontend
flyctl secrets set REACT_APP_API_URL=https://tu-backend.fly.dev
```

---

## Opción 5: Vercel (Solo si tienes backend externo) ▲

```bash
cd frontend
npx vercel
```

Sigue el asistente y configura `REACT_APP_API_URL`.

---

## 📊 Comparación de Opciones

| Servicio | Coste | Facilidad | WebSockets | Performance | Uptime |
|----------|-------|-----------|------------|-------------|---------|
| **Render** | ⭐ Gratis | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Railway** | $5/mes | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Fly.io** | Gratis | ⭐⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Netlify+Render** | Gratis | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## 🎯 Mi Recomendación

Para empezar y probar con amigos:
1. **Render.com** - Completamente gratis, fácil, sin tarjeta

Para uso más serio:
2. **Railway** - $5/mes pero mucho mejor experiencia

Para máximo rendimiento:
3. **Fly.io** - Gratis y súper rápido, pero CLI un poco más complejo

---

## ✅ Checklist Final

Antes de compartir tu juego, verifica:

- [ ] Backend desplegado y accesible
- [ ] Frontend desplegado con variable `REACT_APP_API_URL` correcta
- [ ] WebSockets funcionando (prueba crear una partida)
- [ ] Lector de pantalla funciona correctamente
- [ ] Múltiples jugadores pueden conectarse
- [ ] HTTPS activado (importante para algunos navegadores)

---

## 🆘 Problemas Comunes

### "Error al conectar con el servidor"
- Verifica que `REACT_APP_API_URL` esté configurada
- Asegúrate de que el backend esté despierto (Render free tier)

### "WebSockets no funcionan"
- Render: Funciona automáticamente
- Heroku: Necesitas plan pagado
- Netlify: Solo frontend, no soporta WS

### "La app está muy lenta"
- Render free tier: Normal en primera carga tras inactividad
- Solución: Usar servicio de ping o upgrade

---

## 🔗 URLs Útiles

- **Render**: https://render.com
- **Railway**: https://railway.app
- **Fly.io**: https://fly.io
- **Netlify**: https://netlify.com
- **Cron-Job** (ping): https://cron-job.org

---

**¿Necesitas ayuda?** Abre un issue en GitHub con capturas de pantalla del error.
