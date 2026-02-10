# 🚀 INSTRUCCIONES DE DEPLOY

## Pasos para desplegar en GitHub Pages

### 1. Preparar tu repositorio en GitHub

1. Crea un nuevo repositorio en GitHub (ejemplo: `horario-academico`)
2. NO inicialices el repositorio con README, .gitignore o licencia

### 2. Conectar tu proyecto local con GitHub

Desde la carpeta del proyecto en tu Docker, ejecuta:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

### 3. Configurar para GitHub Pages

#### A. Editar package.json

Abre `package.json` y modifica:

```json
{
  "homepage": "https://TU-USUARIO.github.io/TU-REPO",
  ...
}
```

Y agrega estos scripts:

```json
{
  ...
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  },
  ...
}
```

#### B. Instalar gh-pages

```bash
npm install --save-dev gh-pages
```

### 4. Desplegar

```bash
npm run deploy
```

Este comando:
1. Compilará tu proyecto (`npm run build`)
2. Creará una rama `gh-pages`
3. Subirá el build a esa rama

### 5. Activar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. En "Source", selecciona la rama `gh-pages`
4. Haz clic en Save

¡Listo! Tu app estará disponible en `https://TU-USUARIO.github.io/TU-REPO`

---

## ALTERNATIVA: Deploy manual sin gh-pages

Si prefieres no usar gh-pages:

1. Compila tu proyecto:
```bash
npm run build
```

2. La carpeta `build/` contiene todos los archivos estáticos

3. Puedes:
   - Subirlos directamente a la rama `gh-pages` manualmente
   - Usar cualquier servicio de hosting estático (Netlify, Vercel, etc.)

---

## Solución de problemas

### Rutas rotas en GitHub Pages

Si tus rutas no funcionan, asegúrate de que en `package.json` tengas:
```json
"homepage": "."
```
Para rutas relativas, o la URL completa para GitHub Pages.

### Actualizaciones

Para actualizar tu sitio después de cambios:

```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
npm run deploy
```

---

## Comandos útiles

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm start

# Compilar para producción
npm run build

# Desplegar en GitHub Pages
npm run deploy

# Ver el proyecto en el navegador
# http://localhost:3000
```
