# Vera: implementation assessment

Written after inspecting the Vizibble repository (November 2026), before any Vera code was written.
It records what exists, where the integration boundary sits, and why each design decision was made.

## 1. What the main application actually is

| Area              | What exists                                                                                                                                                                                                                                                                                                                                                     | Notes for Vera                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Runtime           | Bun 1.4, Express 5, TypeScript, Drizzle ORM + `postgres` driver                                                                                                                                                                                                                                                                                                 | Vera uses the same stack, so the team can maintain both                                            |
| Monorepo          | Bun workspaces: `server`, `client`, `shared` (Zod contracts + route table)                                                                                                                                                                                                                                                                                      | Vera is a workspace member, but **nothing depends on Vera** and Vera imports nothing from them     |
| Auth              | Better Auth 1.7 (email + password, verification, Redis-backed rate limits), base path `/api/v2/auth`, cookie sessions                                                                                                                                                                                                                                           | Session cookies are browser-only. They are not MCP bearer tokens                                   |
| Tenancy           | Better Auth organisation plugin. `member` rows hold a role string                                                                                                                                                                                                                                                                                               | `requireOrganisationMember` re-reads membership on every request, so revocation is immediate       |
| RBAC              | `shared/permissions.ts`: Better Auth access control with roles owner/admin/engineer/operator/viewer(/member), resources `location`, `device`, `template`, `telemetry`, `dashboard`, `report`, `settings`                                                                                                                                                        | Vera adds no roles. The main API enforces every permission                                         |
| Locations         | Tree (`parent_id`). Devices may only sit in leaf locations                                                                                                                                                                                                                                                                                                      | Descendant expansion already exists in the analytics engine (`resolveScope`, recursive CTE)        |
| Devices           | Devices instantiate a template version. Soft delete. `last_seen_at` is the only connectivity evidence                                                                                                                                                                                                                                                           | Online/offline status already computed (`OFFLINE_AFTER_SECONDS = 600`)                             |
| Metrics           | Template parameters (`template_metrics`) with key, label, unit, data type (`number`, `integer`, `string`, `boolean`)                                                                                                                                                                                                                                            | Metric discovery exists (`POST /analytics/:org/metrics`)                                           |
| Telemetry         | One row per reading (`value_numeric` / `value_text` / `value_boolean`, exactly one set). Ingest is **HTTP** `POST /api/v2/telemetry` with a device key, not MQTT                                                                                                                                                                                                | The prompt mentioned MQTT. No MQTT broker exists in this repository                                |
| Analytics         | `runAnalyticsQuery`: scope → metric resolution → time range (org timezone) → latest / raw / avg / min / max / sum / count, bucketed or summary. Rejects numeric aggregation on text/booleans. Missing data stays `null` and is reported per device (`metric_not_in_template`, `incompatible_type`, `no_data`). Raw output capped at 5,000 rows with `truncated` | This is exactly the telemetry capability Vera needs. Vera reuses it rather than re-implementing it |
| Dashboards        | Dashboards, widgets, sources and thresholds. Private dashboards visible only to their creator                                                                                                                                                                                                                                                                   | Read-only list/detail can be exposed as is                                                         |
| Alarms            | **Do not exist.** The sidebar has an "Alerts" item, but there is no route, table or API                                                                                                                                                                                                                                                                         | No alarm tools are built. They are deferred until the main app implements alarms                   |
| Reports / exports | Permissions exist (`report:*`, `telemetry:export`), with no implementation                                                                                                                                                                                                                                                                                      | Deferred                                                                                           |
| Queue             | BullMQ on Redis for email (`server/src/worker.ts`)                                                                                                                                                                                                                                                                                                              | Vera's queue decision is in section 4                                                              |
| API conventions   | Routes in `shared/routes.ts`. `{ data }` responses in snake_case, validated against shared Zod schemas. Errors are `{ error: string }` with 400/401/403/404/409                                                                                                                                                                                                 | Vera's API client validates every response at runtime                                              |
| Deployment        | Docker Compose: Caddy (`web`), `api`, `worker`, `migrate`, Postgres 17, Redis 7.4                                                                                                                                                                                                                                                                               | Vera gets its own compose file and image, and its own database                                     |

## 2. The integration boundary

```
ChatGPT / Claude ──MCP (Streamable HTTP, OAuth bearer)──┐
                                                         ├─► Vera ──service credential + user delegation──► /api/v2/integrations/v1/* (main) ──► existing controllers/engine ──► main DB
WhatsApp ── Meta Cloud API webhook ──────────────────────┘     │
                                                               └─► Vera DB (conversations, identities, tool calls, webhook events, jobs)
```

**Vera never reads the main database.** Every business read goes through a new, versioned integration API
on the main server. That API **reuses the existing controllers and the analytics engine**. It adds only
a different way of establishing _who the user is_. Membership, role and permission checks are the
same middleware (`requireOrganisationMember`, `requirePermission`) the dashboard uses.

### How the main API knows which user Vera is acting for

Two credentials travel on every call:

1. **Service credential**: `Authorization: Bearer <VERA_SERVICE_TOKEN>`. It proves the caller is Vera.
   On its own it grants nothing.
2. **User delegation**, which the main server verifies itself:
   - `X-Vizibble-Delegation: mcp`, `X-Vizibble-User: <userId>`, `X-Vizibble-Client: <oauth client id>`.
     The main server requires an **active OAuth consent** by that user for that client, covering the
     `vizibble:read` scope. Disconnecting ChatGPT/Claude deletes the consent, so the next tool call fails
     even if an access token has not yet expired.
   - `X-Vizibble-Delegation: grant`, `X-Vizibble-Grant: <grant token>`. This is a WhatsApp link grant
     issued by the main server when the user completed linking. Only its SHA-256 hash is stored. Unlinking
     revokes it immediately.

The MCP access token itself is **never forwarded** to the main API. The MCP spec forbids token
passthrough, and the token's audience is Vera, not the main API.

A stolen service credential alone cannot read data: it also needs a live consent or grant.
Even with both, the main server still enforces the user's current role in the requested organisation.

## 3. OAuth for ChatGPT and Claude

Better Auth 1.7 moved OAuth-server support out of core into `@better-auth/oauth-provider`. The main
server already owns users, sessions, login UI and RBAC, so **the main server is the OAuth 2.1
authorization server** and **Vera is only the resource server**. This follows the project rule of using
Better Auth's own capabilities rather than building auth around it. Concretely:

- `better-auth` and `@better-auth/drizzle-adapter` go from 1.7.9 to 1.7.20 (a patch bump that the plugin requires).
- `jwt` plugin (signing keys and JWKS) plus the `oauthProvider` plugin: authorization code + PKCE (S256),
  refresh-token rotation, revocation, introspection, RFC 7591 dynamic client registration (ChatGPT and
  Claude both register themselves), RFC 8707 resource indicators, and RFC 8414 metadata.
- Access tokens are JWTs with `aud` set to Vera's MCP URL, a 15-minute lifetime, and `typ: at+jwt`. Vera verifies
  them locally against the main server's JWKS (issuer, audience, type, expiry, `azp`, scope).
- Login and consent pages live in the existing React app (`/login` continues the OAuth flow, `/oauth/consent` is new).
- Organisation choice is **per tool call**, not per token. A user who belongs to several organisations can
  ask about any of them. Every call is re-checked against current membership, and tools ask for an
  organisation when it is ambiguous. A model-supplied organisation id is only ever a _request_.
- All OAuth endpoints are disabled unless `AI_INTEGRATIONS_ENABLED=true`, so the main app can ship
  before Vera exists.

## 4. Decisions about Vera itself

| Topic        | Decision                                                                                                                                                        | Why                                                                                                                                                                                                                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Packaging    | Workspace member `Vera/` (`@vizibble/vera`). Imports nothing from `server`, `client` or `shared`, and nothing imports it. An automated test enforces this       | Independent lifecycle while sharing the toolchain                                                                                                                                                                                                                                                                          |
| HTTP         | Express 5 with `@modelcontextprotocol/server` 2.x (the SDK's stable line; 1.x is in maintenance), `@modelcontextprotocol/express`, `@modelcontextprotocol/node` | Uses the current, supported Streamable HTTP transport. It serves both the 2026-07-28 and 2025-era protocol revisions statelessly                                                                                                                                                                                           |
| MCP state    | Stateless: one server instance per request, built for the authenticated user                                                                                    | Scales horizontally behind a load balancer with no sticky sessions                                                                                                                                                                                                                                                         |
| Database     | Separate PostgreSQL database `vera` with its own Drizzle schema and migrations                                                                                  | Spec requirement. Holds no telemetry or membership data                                                                                                                                                                                                                                                                    |
| Queue        | **PostgreSQL job table** in the Vera database (`FOR UPDATE SKIP LOCKED`), not Redis/BullMQ                                                                      | A webhook event and its job are written in one transaction, and the WhatsApp message id is unique, so deduplication and durability are atomic. No new infrastructure is needed. WhatsApp volume is far below what this design handles. Retries, backoff, leases (timeouts), dead letters and depth metrics are implemented |
| AI providers | One `LlmProvider` interface with OpenAI and Anthropic adapters. Model chosen by environment variable                                                            | The orchestrator never imports a provider SDK                                                                                                                                                                                                                                                                              |
| Agents       | One manager (`ConversationManager`) with a bounded tool loop. No specialist agents yet                                                                          | Spec section 9. Current complexity does not justify them                                                                                                                                                                                                                                                                   |
| Tools        | One registry shared by MCP and WhatsApp. Every tool has a strict Zod input, bounded ranges and results, and calls exactly one typed API-client operation        | One implementation of every capability                                                                                                                                                                                                                                                                                     |

## 5. Tools that will and will not be exposed

| Spec tool                                                                       | Status        | Backed by                                                                            |
| ------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ |
| `list_organizations`, `get_organization_details`                                | Built         | new `GET /integrations/v1/me`, `GET /integrations/v1/organisations/:id`              |
| `list_locations`, `get_location_details`, `list_location_devices`               | Built         | existing location controllers, plus a new scoped device list (reuses `resolveScope`) |
| `list_devices`, `get_device_details`, `list_device_metrics`                     | Built         | scoped device list, existing device controller, existing metric discovery            |
| `get_latest_readings`, `get_telemetry`, `compare_devices`, `get_metric_summary` | Built         | existing analytics engine, plus a new keyset-paginated raw-readings endpoint         |
| `list_dashboards`, `get_dashboard_summary`                                      | Built         | existing dashboard controllers                                                       |
| `list_active_alarms`, `get_alarm_history`, `get_alarm_details`                  | **Not built** | Alarms do not exist in the main app. No placeholder is created                       |

## 6. Main-application changes, and why each is needed

1. **Better Auth upgrade + `jwt` + `oauthProvider` plugins, with migration.** Required for ChatGPT/Claude OAuth.
2. **Integration API `/api/v2/integrations/v1/*`.** Service-authenticated and user-delegated. Mostly mounts existing controllers. Two genuinely new reads:
   - a scoped device list with connectivity (location + descendants)
   - keyset-paginated raw readings (the existing `GET /telemetry/:org` has no cursor)
3. **WhatsApp link codes and link grants.** Two new tables (`integration_link_codes`, `integration_grants`), with hashed secrets only.
4. **User-facing integration management** `/api/v2/integrations/*` (session auth): list connections, create a WhatsApp link code, unlink WhatsApp, disconnect an AI client.
5. **Frontend.** An Integrations page (utility navigation), an OAuth consent page, and login-page continuation of the OAuth flow.
6. **Deployment.** The main Dockerfiles copy `Vera/package.json` so the frozen workspace lockfile resolves. Vera's source never enters the main images.

No existing endpoint changes its contract. Telemetry ingestion is untouched.

## 7. Known constraints

- JWT access tokens cannot be revoked before they expire. They are therefore short-lived (15 minutes), and the main
  server re-checks the consent on every data call, so disconnecting takes effect at the next tool call.
- Real ChatGPT/Claude connection tests need a public HTTPS deployment of both apps. Locally, the full OAuth + MCP
  flow is exercised by automated tests that act as an MCP client (dynamic registration → PKCE → consent → token → tools).
- WhatsApp needs a Meta app, a WABA phone number, a permanent access token and an app secret. Section 8 of
  `docs/WHATSAPP.md` lists them.

## 8. Decisions revised during the build

- **Queue:** BullMQ on (hosted) Redis, the same stack as the main server's email queue. This replaces the Postgres job table. Dedupe uses the webhook event table plus `jobId` = WhatsApp message id.
- **AI provider:** OpenAI only, through the **OpenAI Agents SDK**. It provides native tool approval (`needsApproval`) and a resumable run state for human-in-the-loop. There is no provider abstraction layer.
- **Libraries:** axios + opossum for the main-API client, and plain `console` JSON logs with redaction. No pino or Prometheus, to stay close to the main server's stack.
- **Writes:** full create/update/delete for locations, devices, templates, dashboards/widgets and the organisation timezone, with human approval:
  - **WhatsApp:** YES/NO before every change.
  - **MCP:** a separate opt-in `vizibble:write` consent, and tools marked non-read-only or destructive.
  - **Excluded:** member/role management, organisation deletion and device keys.
