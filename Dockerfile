# Keep in sync with .nvmrc so laptop, CI and container run the same Node
ARG NODE_VERSION=24.21.0

# ---- base: shared starting point with only the dependency manifests ----
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

# ---- deps: production dependencies only ----
FROM base AS deps
RUN npm ci --omit=dev

# ---- test: all dependencies + source, runs lint and tests ----
# Only built when asked for:  docker build --target test .
FROM base AS test
RUN npm ci
COPY . .
RUN npm run lint && npm test

# ---- runtime: the image that actually ships ----
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY public ./public

# The official Node image includes an unprivileged "node" user
USER node
EXPOSE 3000

# Lets Docker (and Compose) know whether the app is actually working, not just running
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Run node directly (not "npm start") so SIGTERM reaches the app
CMD ["node", "src/server.js"]
