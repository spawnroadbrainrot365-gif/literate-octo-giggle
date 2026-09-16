FROM node:20-slim

WORKDIR /app

# مكتبات بناء better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV DB_PATH=/app/data/data.db
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "server.js"]
