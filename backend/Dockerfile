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
CMD ["sh", "-c", "node src/resolve-dns.js >/tmp/app_url 2>/dev/null; if [ -s /tmp/app_url ]; then export $(cat /tmp/app_url); echo \"[entrypoint] APP_URL=$APP_URL (hosts_app_dns)\"; fi; node prisma/migrate-age-groups.js dump && npx prisma db push --accept-data-loss && node prisma/migrate-age-groups.js restore && node prisma/seed.js && node src/index.js"]
