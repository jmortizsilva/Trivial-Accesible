# Script para preparar el proyecto antes de subirlo a GitHub

Write-Host "🧹 Limpiando archivos innecesarios..." -ForegroundColor Cyan

# Eliminar node_modules si existen (se reinstalarán con npm install)
if (Test-Path "backend\node_modules") {
    Write-Host "  ❌ Eliminando backend/node_modules..." -ForegroundColor Yellow
    Remove-Item -Path "backend\node_modules" -Recurse -Force
}

if (Test-Path "frontend\node_modules") {
    Write-Host "  ❌ Eliminando frontend/node_modules..." -ForegroundColor Yellow
    Remove-Item -Path "frontend\node_modules" -Recurse -Force
}

# Eliminar build si existe
if (Test-Path "frontend\build") {
    Write-Host "  ❌ Eliminando frontend/build..." -ForegroundColor Yellow
    Remove-Item -Path "frontend\build" -Recurse -Force
}

Write-Host ""
Write-Host "✅ Limpieza completada" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Archivos que SE SUBIRÁN a GitHub:" -ForegroundColor Cyan
Write-Host "  ✓ README.md (documentación principal)" -ForegroundColor Green
Write-Host "  ✓ DEPLOY.md (guía de despliegue)" -ForegroundColor Green
Write-Host "  ✓ render.yaml (configuración Render)" -ForegroundColor Green
Write-Host "  ✓ .gitignore" -ForegroundColor Green
Write-Host "  ✓ backend/ (código del servidor)" -ForegroundColor Green
Write-Host "    - server.js" -ForegroundColor Gray
Write-Host "    - package.json" -ForegroundColor Gray
Write-Host "    - data/questions.json (1901 preguntas)" -ForegroundColor Gray
Write-Host "    - utils/ y services/" -ForegroundColor Gray
Write-Host "  ✓ frontend/ (código de la app)" -ForegroundColor Green
Write-Host "    - src/" -ForegroundColor Gray
Write-Host "    - public/" -ForegroundColor Gray
Write-Host "    - package.json" -ForegroundColor Gray
Write-Host ""
Write-Host "❌ Archivos que NO se subirán:" -ForegroundColor Red
Write-Host "  ✗ node_modules/ (demasiado grande)" -ForegroundColor Gray
Write-Host "  ✗ build/ y dist/ (se generan en producción)" -ForegroundColor Gray
Write-Host "  ✗ .env (configuración local)" -ForegroundColor Gray
Write-Host "  ✗ *.log (archivos de log)" -ForegroundColor Gray
Write-Host "  ✗ Documentación antigua (.md obsoletos)" -ForegroundColor Gray
Write-Host "  ✗ Scripts .bat (solo para Windows local)" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 Tamaño estimado del repositorio:" -ForegroundColor Cyan

# Calcular tamaño aproximado
$backendSize = (Get-ChildItem -Path "backend" -Recurse -File -Exclude "node_modules" | Measure-Object -Property Length -Sum).Sum
$frontendSize = (Get-ChildItem -Path "frontend" -Recurse -File -Exclude "node_modules" | Measure-Object -Property Length -Sum).Sum
$totalSize = $backendSize + $frontendSize
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host "  📦 Total: $totalSizeMB MB (sin node_modules)" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Siguiente paso: Ejecuta estos comandos" -ForegroundColor Yellow
Write-Host ""
Write-Host "git init" -ForegroundColor White
Write-Host "git add ." -ForegroundColor White
Write-Host "git commit -m 'Trivial accesible - Primera versión'" -ForegroundColor White
Write-Host "git branch -M main" -ForegroundColor White
Write-Host "git remote add origin https://github.com/TU_USUARIO/trivial-accesible.git" -ForegroundColor White
Write-Host "git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Recuerda:" -ForegroundColor Yellow
Write-Host "  1. Crear el repositorio en GitHub primero (github.com → New repository)" -ForegroundColor Gray
Write-Host "  2. NO añadir README ni .gitignore (ya los tienes)" -ForegroundColor Gray
Write-Host "  3. Cambiar TU_USUARIO por tu usuario de GitHub" -ForegroundColor Gray
Write-Host ""
