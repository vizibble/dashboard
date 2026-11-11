# Builds the React client and serves it with Caddy, which also proxies /api (build context: repo root)
FROM oven/bun:1.4.2-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY server/package.json server/
COPY client/package.json client/
COPY shared/package.json shared/
# Manifest only, so the frozen lockfile resolves. Vera is never built into this image.
COPY Vera/package.json Vera/
RUN bun install --frozen-lockfile
COPY shared ./shared
COPY client ./client

# Public URL is inlined into the bundle at build time
ARG BUN_PUBLIC_API_URL
RUN test -n "$BUN_PUBLIC_API_URL" || (echo "BUN_PUBLIC_API_URL build arg is required" && exit 1)
ENV BUN_PUBLIC_API_URL=$BUN_PUBLIC_API_URL
WORKDIR /app/client
RUN bun run build.ts && rm -f dist/*.map

FROM caddy:2.10-alpine
COPY infra/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/client/dist /srv
