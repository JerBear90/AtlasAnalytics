FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY src/db/migrations ./dist/db/migrations

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 4000
ENV DATABASE_PATH=/app/data/portal.db
CMD ["node", "dist/index.js"]
