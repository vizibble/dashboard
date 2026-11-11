# Vera: Vizibble AI

Vera is Vizibble's AI integration service. It lets people work with their industrial IoT data from **ChatGPT**, **Claude** (remote MCP) and **WhatsApp** (Meta Cloud API).

Vera is a separate application with its own process, database, queue workers, configuration and deployment. It never touches the main Vizibble database. Every read and write goes through the main app's versioned integration API, which applies the same roles and permissions as the dashboard.

```
ChatGPT / Claude ─ MCP (Streamable HTTP + OAuth) ─┐
                                                  ├─► Vera ─ service token + user delegation ─► /api/v2/integrations/v1 (main app) ─► existing controllers ─► main DB
WhatsApp ─ Meta webhook ─► BullMQ ─► agent ───────┘    └─► Vera DB (links, conversations, approvals, tool audit, webhook events)
```

## What it does

- **Shared tools (35)**, one allowlist for every channel ([src/tools](src/tools)):
  - **Reads:** organisations, locations, devices with connectivity, metrics, latest readings, telemetry history, device comparisons, metric summaries against the previous period, dashboards, templates, metric catalogue, settings.
  - **Changes:** create/rename/delete locations; register/update/delete devices; create/update/delete templates and their parameters; create/update/delete dashboards and widgets; set the organisation timezone.
  - Analytic tools return **computed highlights** (trend, extremes with times, % change, rankings), so answers never depend on model arithmetic.
- **MCP server** at `/mcp` (official SDK v2, stateless Streamable HTTP; serves the 2026-07-28 and 2025 protocol revisions). It's an OAuth resource server: tokens are issued by the main app's Better Auth and verified against its JWKS (issuer, audience = this endpoint, `at+jwt`, expiry, scope).
- **WhatsApp assistant** built on the **OpenAI Agents SDK**:
  - One manager agent works with the shared tools.
  - Webhooks are signature-checked, deduplicated, persisted, queued and acknowledged straight away. A worker does the AI work.
  - Account linking uses single-use codes created in the dashboard.

## Safety model

| Concern          | How it's handled                                                                                                                                                                                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Who is asking    | MCP: verified OAuth JWT. WhatsApp: a phone number grants nothing until linked with a single-use code                                                                                                                                                                                                           |
| What they may do | The main API re-checks membership and role on **every** call. Organisation ids from a model are only requests                                                                                                                                                                                                  |
| Revocation       | Disconnecting or unlinking in the dashboard blocks the **next** call (consent/grant checked server-side)                                                                                                                                                                                                       |
| Changes          | ChatGPT/Claude: a separate `vizibble:write` consent, opt-in on the consent screen. Write tools are marked non-read-only or destructive, so the apps ask before each call. WhatsApp: every write pauses the run (`needsApproval`); Vera states the exact change and runs it only after the user replies **YES** |
| Never offered    | Members/roles, deleting organisations, device keys, arbitrary HTTP/SQL                                                                                                                                                                                                                                         |
| Prompt injection | Tool results are data, there are no hidden capabilities, and authorisation lives outside the model                                                                                                                                                                                                             |
| Cost and abuse   | Per-user limits (20 msgs/10 min, 200/day), MCP rate limit, max 10 agent turns, bounded ranges and result sizes                                                                                                                                                                                                 |
| Secrets          | Grant tokens and paused runs are AES-256-GCM encrypted, phone numbers are stored as HMAC, logs are redacted, the MCP token is never forwarded                                                                                                                                                                  |
| Grounding        | Numbers come only from tools; missing data stays missing (never zero)                                                                                                                                                                                                                                          |

## Run locally

```sh
bun install                         # from the repository root (Vera is a workspace member)
cp Vera/.env.example Vera/.env      # fill in
cd Vera
bun run db:migrate                  # Vera's own database
bun run dev                         # API: MCP, WhatsApp webhook, /health
bun run worker:dev                  # WhatsApp worker
```

On the main server, set `AI_INTEGRATIONS_ENABLED=true`, `VERA_MCP_URL`, `VERA_SERVICE_TOKEN` (same value as Vera's `VIZIBBLE_SERVICE_TOKEN`) and optionally `VERA_WHATSAPP_NUMBER`. Then run its migrations.

## Deploy

```sh
docker compose -f Vera/docker-compose.yml --env-file Vera/.env up -d --build
docker compose -f Vera/docker-compose.yml up -d --scale api=2 --scale worker=3
```

Put Vera behind HTTPS at its own domain (for example `https://ai.vizibble.in`). Expose only:

| Endpoint                                      | Purpose                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| `/mcp`                                        | MCP server                                                               |
| `/.well-known/oauth-protected-resource[/mcp]` | Tells AI clients where to sign in                                        |
| `/webhooks/whatsapp`                          | Meta webhook                                                             |
| `/health`                                     | Database, queue depth and failed jobs, main API, circuit state, counters |

Restarting or redeploying Vera never affects the dashboard, the API or telemetry ingestion. If Vera is down, only the AI channels stop.

## Connect ChatGPT and Claude

In Vizibble, open **Integrations** to copy the connector address (`https://ai.vizibble.in/mcp`).

- **ChatGPT:** Settings → Apps & Connectors → Create → paste the address → OAuth.
- **Claude:** Settings → Connectors → Add custom connector → paste the address.

The app registers itself (dynamic client registration) and sends you to Vizibble to sign in. On the consent screen, tick **Also allow it to make changes** only if you want edits. Connections appear under **Integrations**, where you can disconnect them.

## Set up WhatsApp (Meta Cloud API)

1. In Meta for Developers, create an app with the WhatsApp product and add a business phone number.
2. Create a system user with a permanent token (`whatsapp_business_messaging`). This is `WHATSAPP_ACCESS_TOKEN`. Note `WHATSAPP_PHONE_NUMBER_ID` and the app secret (`WHATSAPP_APP_SECRET`).
3. Configure the webhook: callback `https://ai.vizibble.in/webhooks/whatsapp`, verify token = `WHATSAPP_VERIFY_TOKEN`. Subscribe to `messages`.
4. Set `WHATSAPP_ENABLED=true` and `OPENAI_API_KEY`. On the main server, set `VERA_WHATSAPP_NUMBER` to the display number.
5. Users link their number from **Integrations → WhatsApp → Connect** and send the `LINK XXXX-XXXX` code.
   - Send **UNLINK** to disconnect.
   - Reply **YES** or **NO** to approve or decline a proposed change.

Vera only replies to messages users send, so it stays inside WhatsApp's 24-hour customer-service window and needs no message templates. Proactive messages (scheduled summaries, alerts) would need approved templates.

## Configuration

See [.env.example](.env.example). Every variable is validated at start-up ([src/config/env.ts](src/config/env.ts)), and the service refuses to start with an invalid configuration.

## Not built yet

- **Alarms.** The main app has no alarms yet, so there are no alarm tools.
- **Reports and exports.** They don't exist in the main app yet.
- **Specialist agents.** One manager agent is enough today. Add specialists (diagnostics, reporting) as Agents SDK handoffs when there's real need.
- **Real ChatGPT/Claude/Meta tests.** These need the deployed HTTPS endpoints and Meta credentials.

More detail: [docs/ASSESSMENT.md](docs/ASSESSMENT.md) (design decisions) and [docs/MAIN_APP_CHANGES.md](docs/MAIN_APP_CHANGES.md) (every change to the main application).
