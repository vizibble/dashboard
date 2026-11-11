# Deploying Vizibble

Everything runs with Docker Compose on any machine that has Docker installed.

| Container  | What it does                                                                    |
| ---------- | ------------------------------------------------------------------------------- |
| `web`      | Caddy: serves the React app, proxies `/api` to the API, handles HTTPS           |
| `api`      | Express + Better Auth                                                           |
| `worker`   | BullMQ worker that sends queued emails                                          |
| `migrate`  | Runs database migrations, then exits. `api` and `worker` wait for it to finish  |
| `postgres` | Database (data kept in the `postgres-data` volume)                              |
| `redis`    | Email queue and auth rate limits (data kept in the `redis-data` volume)         |

Only `web` is exposed (ports 80 and 443). The app and API share one domain, so no CORS or cross-site cookies are involved.

## First deploy

```sh
cp infra/.env.example infra/.env   # then fill it in
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build
```

For a real server set `DOMAIN=app.example.com` and `PUBLIC_URL=https://app.example.com`, and point the domain's DNS at the server.
Caddy gets a certificate on first start. With `DOMAIN=localhost` it uses a local self-signed certificate, so the browser shows a warning.

## Updating

```sh
git pull
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build
```

Migrations run automatically on every start.

## Useful commands

```sh
docker compose -f infra/docker-compose.yml logs -f api worker   # follow logs
docker compose -f infra/docker-compose.yml up -d --scale worker=3  # more email workers
docker compose -f infra/docker-compose.yml exec postgres pg_dump -U vizibble vizibble > backup.sql
```

`PUBLIC_URL` is built into the client bundle, so rebuild (`--build`) after changing it.

## Local development

Run only Postgres and Redis in Docker, and the apps with Bun:

```sh
docker compose -f infra/docker-compose.dev.yml up -d
cd server && bun run dev          # API
cd server && bun run worker:dev   # email worker
cd client && bun run dev          # client
```

Set `REDIS_URL=redis://localhost:6379` and `DATABASE_URL=postgres://vizibble:vizibble@localhost:5432/vizibble` in `server/.env`.
