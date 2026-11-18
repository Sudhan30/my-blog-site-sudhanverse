# Build stage: install dependencies and build the Astro site
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun --bun astro build

# Production stage
FROM oven/bun:1-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=80 ASTRO_TELEMETRY_DISABLED=1

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/content ./content
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json /app/server.mjs ./

EXPOSE 80

# Static files, pages, feeds and /api are all served by server.mjs
CMD ["bun", "server.mjs"]
