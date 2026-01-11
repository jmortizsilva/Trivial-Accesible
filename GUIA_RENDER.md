# 🚀 Guía Paso a Paso: GitHub → Render

## Parte 1: Subir a GitHub (15 minutos)

### Paso 1: Preparar el proyecto

```powershell
# Ejecutar script de limpieza
cd "c:\Users\jmortizsilva\OneDrive\Pruebas VS code\Trivial"
.\preparar-github.ps1
```

Esto eliminará `node_modules/` y te mostrará qué se subirá.

### Paso 2: Crear repositorio en GitHub

1. Ve a https://github.com
2. Haz clic en **"New"** (botón verde) o el **+** en la esquina superior derecha
3. Configuración:
   ```
   Repository name: trivial-accesible
   Description: Juego de Trivial 100% accesible para personas ciegas
   Public ✅ (para que sea visible)
   ❌ NO añadir README
   ❌ NO añadir .gitignore
   ❌ NO añadir licencia
   ```
4. Click **"Create repository"**

### Paso 3: Subir código a GitHub

Copia tu usuario de GitHub y ejecuta estos comandos **uno por uno**:

```powershell
cd "c:\Users\jmortizsilva\OneDrive\Pruebas VS code\Trivial"

# Inicializar git
git init

# Añadir archivos (respeta .gitignore)
git add .

# Verificar qué se subirá
git status

# Hacer commit
git commit -m "Trivial accesible - Versión inicial con 1901 preguntas"

# Cambiar a rama main
git branch -M main

# Conectar con GitHub (CAMBIA jmortizsilva por TU usuario)
git remote add origin https://github.com/jmortizsilva/trivial-accesible.git

# Subir
git push -u origin main
```

**Si pide autenticación:**
- Usuario: tu usuario de GitHub
- Contraseña: usa un **Personal Access Token** (no tu contraseña)
  - GitHub → Settings → Developer settings → Personal access tokens → Generate new token
  - Permisos necesarios: `repo`

### Paso 4: Verificar

Ve a tu repositorio: `https://github.com/TU_USUARIO/trivial-accesible`

Deberías ver:
- ✅ README.md
- ✅ backend/
- ✅ frontend/
- ✅ DEPLOY.md
- ✅ render.yaml
- ❌ NO debe haber node_modules/

---

## Parte 2: Desplegar en Render (10 minutos)

### Paso 1: Crear cuenta en Render

1. Ve a https://render.com
2. Click **"Get Started"**
3. Regístrate con **GitHub** (más fácil)
4. Autoriza a Render a acceder a tus repositorios

### Paso 2: Desplegar Backend

1. En Render Dashboard, click **"New +"** → **"Web Service"**

2. **Conectar repositorio:**
   - Busca `trivial-accesible`
   - Click **"Connect"**

3. **Configuración del servicio:**
   ```
   Name: trivial-backend
   Region: Frankfurt (o el más cercano a España)
   Branch: main
   Root Directory: backend
   
   Runtime: Node
   
   Build Command: npm install
   
   Start Command: node server.js
   
   Instance Type: Free
   ```

4. **Variables de entorno (opcional):**
   - Por ahora NO añadas ninguna

5. Click **"Create Web Service"**

6. **Espera 2-3 minutos**. Verás logs en pantalla.

7. Cuando aparezca **"Live"** en verde:
   - Copia la URL: `https://trivial-backend-XXXX.onrender.com`
   - Guárdala para el siguiente paso

8. **Probar backend:**
   - Abre la URL en el navegador
   - Deberías ver: `{"message":"Servidor de Trivial funcionando"}`
   - ✅ Backend funcionando

### Paso 3: Desplegar Frontend

1. Click **"New +"** → **"Static Site"**

2. **Conectar el mismo repositorio:**
   - `trivial-accesible`
   - Click **"Connect"**

3. **Configuración:**
   ```
   Name: trivial-frontend
   Branch: main
   Root Directory: frontend
   
   Build Command: npm install && npm run build
   
   Publish Directory: build
   ```

4. **Variables de entorno (IMPORTANTE):**
   - Click **"Advanced"**
   - Click **"Add Environment Variable"**
   - Key: `REACT_APP_API_URL`
   - Value: `https://trivial-backend-XXXX.onrender.com` (URL del backend SIN barra final)

5. Click **"Create Static Site"**

6. **Espera 3-5 minutos**

7. Cuando aparezca **"Live"**:
   - Copia la URL: `https://trivial-frontend-XXXX.onrender.com`
   - ✅ Frontend funcionando

### Paso 4: Probar el Juego

1. Abre la URL del frontend en tu navegador
2. Deberías ver la pantalla de inicio
3. **Prueba crear una partida:**
   - Nombre: "Prueba"
   - Click "Crear nueva partida"
   - Si aparece un código (ej: "ABCD") → ✅ **TODO FUNCIONA**

4. **Prueba con lector de pantalla:**
   - Activa NVDA o Narrator
   - Navega con Tab
   - Verifica que los anuncios funcionen

---

## ⚠️ Problemas Comunes

### "Error al conectar con el servidor"

**Causa:** El backend está durmiendo (Render free tier)

**Solución:**
1. Abre la URL del backend directamente
2. Espera 30-60 segundos a que despierte
3. Recarga el frontend

### "Build failed" en el frontend

**Causa:** Falta la variable `REACT_APP_API_URL`

**Solución:**
1. Ve a tu Static Site en Render
2. Settings → Environment
3. Añade: `REACT_APP_API_URL` = URL del backend
4. Click "Save Changes"
5. Se redesplegar automáticamente

### "Cannot GET /"

**Causa:** El backend no tiene ruta raíz

**Solución:** Es normal, el backend funciona en `/api/*`
- Prueba: `https://tu-backend.onrender.com/api/games` (debería dar error 400, está bien)

### "Module not found" en el build

**Causa:** Falta alguna dependencia en package.json

**Solución:**
1. Ve a los logs del build en Render
2. Identifica el módulo que falta
3. En local: `npm install nombre-modulo`
4. Commit y push a GitHub
5. Render redesplegar automáticamente

---

## 📋 Checklist Final

Antes de compartir tu juego:

- [ ] Backend desplegado y activo (URL termina en .onrender.com)
- [ ] Frontend desplegado y activo (URL termina en .onrender.com)
- [ ] Variable `REACT_APP_API_URL` configurada en frontend
- [ ] Puedes crear una partida
- [ ] Puedes unirte a una partida
- [ ] Las preguntas se cargan correctamente
- [ ] El lector de pantalla anuncia los eventos
- [ ] Múltiples jugadores pueden jugar (prueba en 2 pestañas)

---

## 🎉 ¡Listo para Compartir!

Tu URL pública será:
```
https://trivial-frontend-XXXX.onrender.com
```

Compártela con tus amigos y prueba el juego.

**Nota sobre el plan gratuito:**
- El backend "duerme" después de 15 minutos sin uso
- La primera conexión tras dormir tarda 30-60 segundos
- Es normal, todos los servicios gratuitos hacen esto

**Para evitarlo:**
- Usa un servicio de ping gratuito: https://cron-job.org
- O upgrade a plan pagado: $7/mes para mantenerlo activo 24/7

---

## 🔄 Actualizar el Juego

Cuando hagas cambios en el código:

```powershell
git add .
git commit -m "Descripción de los cambios"
git push
```

Render detectará el cambio y redesplegar automáticamente (2-5 minutos).

---

## 📞 Soporte

Si algo no funciona:
1. Revisa los logs en Render (pestaña "Logs")
2. Verifica las variables de entorno
3. Asegúrate de que el backend esté despierto
4. Prueba en navegador privado (sin caché)
