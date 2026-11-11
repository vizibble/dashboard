# API, email worker and migrations share this image (build context: repo root)
FROM oven/bun:1.4.2-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY server/package.json server/
COPY client/package.json client/
COPY shared/package.json shared/
# Manifest only, so the frozen lockfile resolves. Vera is never built into this image.
COPY Vera/package.json Vera/
RUN bun install --frozen-lockfile

FROM oven/bun:1.4.2-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app ./
COPY shared ./shared
COPY server ./server
WORKDIR /app/server
USER bun
EXPOSE 3000
CMD ["bun", "src/index.ts"]
