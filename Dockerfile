# Imagine UNICA: build frontend SPA + backend care o serveste pe acelasi port/DNS.
# Rezultat: http://localhost:4000 (site) + http://localhost:4000/api/health (API)

FROM node:22-alpine AS frontend-build
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# debian-slim (glibc): prebuilt binar better-sqlite3, fara compilatoare
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm install
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./
# generate la build (URL temporar — cel real vine din .env la runtime)
ENV DATABASE_URL="file:/tmp/prisma-build.db"
RUN test -f prisma.config.ts || (echo "EROARE: lipseste backend/prisma.config.ts — sincronizeaza TOATE fisierele proiectului pe server!" && exit 1); npx prisma generate
COPY backend/src ./src
COPY --from=frontend-build /fe/dist ./public
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "node prisma/migrate-age-groups.js dump && npx prisma db push --accept-data-loss && node prisma/migrate-age-groups.js restore && node prisma/seed.js && node src/index.js"]
