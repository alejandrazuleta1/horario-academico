# 📅 Generador de Horarios Académicos

Aplicación web para generar horarios académicos de manera automática, respetando restricciones de disponibilidad de profesores y evitando conflictos.

## ✨ Características

- 📊 **Gestión completa**: Profesores, cursos, grupos y restricciones
- 🤖 **Generación automática**: Algoritmo inteligente que respeta todas las restricciones
- 👁️ **Múltiples vistas**: General, por profesor, y por grupo
- 💾 **Persistencia local**: Tus datos se guardan automáticamente en el navegador
- 📥 **Exportación**: Descarga tus horarios en formato JSON
- 📱 **Responsive**: Funciona en desktop, tablet y móvil

## 🚀 Instalación y Uso

### En Docker

1. **Instalar dependencias**:
```bash
npm install
```

2. **Ejecutar en modo desarrollo**:
```bash
npm start
```

La aplicación se abrirá en `http://localhost:3000`

3. **Compilar para producción**:
```bash
npm run build
```

Esto generará una carpeta `build/` lista para desplegar.

## 🌐 Desplegar en GitHub Pages

### Opción 1: Desde tu repositorio

1. **Actualiza el package.json**:
   - Cambia la línea `"homepage": "."` por `"homepage": "https://TU-USUARIO.github.io/NOMBRE-REPO"`

2. **Instala gh-pages**:
```bash
npm install --save-dev gh-pages
```

3. **Agrega scripts de deploy al package.json**:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build",
  ...
}
```

4. **Despliega**:
```bash
npm run deploy
```

### Opción 2: Deploy manual

1. Compila el proyecto: `npm run build`
2. Sube el contenido de la carpeta `build/` a la rama `gh-pages` de tu repositorio
3. Activa GitHub Pages en la configuración del repositorio

## 📖 Cómo usar la aplicación

### 1. Agregar Datos

- **Profesores**: Nombre y horas máximas por semana
- **Cursos**: Nombre, horas por semana, y duración de cada sesión
- **Grupos**: Nombre y capacidad de estudiantes
- **Restricciones**: Días y horas en que los profesores NO están disponibles

### 2. Generar Horario

Haz clic en "Generar Horario" y el algoritmo creará automáticamente un horario optimizado.

### 3. Visualizar

- **Vista General**: Todos los horarios en una sola tabla
- **Por Profesor**: Horario individual de cada profesor
- **Por Grupo**: Horario específico de cada grupo

### 4. Exportar

Descarga el horario completo en formato JSON para guardarlo o compartirlo.

## 🛠️ Tecnologías

- **React 18**: Framework principal
- **Lucide React**: Iconos
- **CSS moderno**: Estilos personalizados sin librerías adicionales
- **LocalStorage**: Persistencia de datos en el navegador

## 📝 Notas

- Los datos se guardan automáticamente en tu navegador
- No se requiere conexión a internet después de cargar la app
- Compatible con todos los navegadores modernos

## 🤝 Contribuir

Si encuentras bugs o tienes sugerencias, siéntete libre de crear un issue o pull request.

## 📄 Licencia

MIT License - Siéntete libre de usar este proyecto como desees.

---

Hecho con ❤️ para facilitar la organización académica
