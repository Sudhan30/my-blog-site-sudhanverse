# Build stage
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .

# Production stage
FROM oven/bun:1-slim
WORKDIR /app

# Copy application files
COPY --from=builder /app/server ./server
COPY --from=builder /app/content ./content
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose port
EXPOSE 3000

# Start the server
CMD ["bun", "run", "server/index.ts"]
