FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY prisma ./prisma
COPY prisma.config.ts ./
ENV DATABASE_URL="file:/tmp/prisma-build.db"
RUN npx prisma generate
COPY src ./src
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "node prisma/migrate-age-groups.js dump && npx prisma db push --accept-data-loss && node prisma/migrate-age-groups.js restore && node prisma/seed.js && node src/index.js"]
