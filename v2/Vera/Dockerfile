# Vera: API, worker and migrations share this image. Build context: repository root
#   docker build -f Vera/Dockerfile -t vizibble-vera .
FROM oven/bun:1.4.2-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY server/package.json server/
COPY client/package.json client/
COPY shared/package.json shared/
COPY Vera/package.json Vera/
RUN bun install --frozen-lockfile --production --filter '@vizibble/vera'

FROM oven/bun:1.4.2-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app ./
COPY Vera ./Vera
WORKDIR /app/Vera
USER bun
EXPOSE 4100
HEALTHCHECK --interval=15s --timeout=5s --retries=4 CMD wget -qO- http://127.0.0.1:4100/health || exit 1
CMD ["bun", "src/index.ts"]
