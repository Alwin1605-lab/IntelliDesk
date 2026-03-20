FROM node:20-alpine

WORKDIR /app

# wget is needed for the Docker healthcheck
RUN apk add --no-cache wget

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
