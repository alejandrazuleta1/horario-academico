FROM node:18-alpine

# Instalar Git
RUN apk add --no-cache git

# Configurar directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del proyecto
COPY . .

# Exponer puerto 3000
EXPOSE 3000

# Comando por defecto
CMD ["npm", "start"]
