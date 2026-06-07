# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:18-alpine AS runner
WORKDIR /app

# Non-root security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only what's needed
COPY --from=deps /app/node_modules ./node_modules
COPY src        ./src
COPY public     ./public
COPY package.json ./

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

# Kubernetes liveness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://localhost:3000/health || exit 1

ENV NODE_ENV=production

CMD ["node", "src/app.js"]
