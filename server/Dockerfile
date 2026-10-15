# KrishiBazaar API — production image.
# Build from the repository root:  docker build -f server/Dockerfile -t krishibazaar-api ./server

# ── Build stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ── Runtime stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Prisma needs OpenSSL at runtime.
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

# Run as a non-root user.
USER node

EXPOSE 4000

# Apply migrations when they exist, otherwise fall back to `db push` for a
# database that has not been baselined yet (the current SQLite setup).
# See README "Going to production" for how to create the initial migration.
CMD ["sh", "-c", "if [ -d prisma/migrations ]; then npx prisma migrate deploy; else echo 'No prisma/migrations found — using db push'; npx prisma db push --skip-generate; fi; exec node dist/src/index.js"]
