# Render Deployment Pre-Check

Pre-render readiness sweep: audit consistency and minimal code changes for deploy/runtime safety. **No feature work.**

> Current deploy instructions live in [VERCEL_FRONTEND_RENDER_BACKEND.md](VERCEL_FRONTEND_RENDER_BACKEND.md) and [RENDER.md](RENDER.md). Use those files for the actual Vercel + Render env names.

---

## 1. Backend — Render Web Service

### Root directory
- **`backend`** (monorepo root is repo root; set Render "Root Directory" to `backend` so `server.js` and `package.json` are the app root).

### Build command
- **Leave empty** or `npm install --omit=dev` if you use a build step. The app runs from source; no compile step required.

### Start command
- **`node server.js`**  
  (or `npm start`, which runs `node server.js` per `backend/package.json`).

### Health check path
- **`/health`** or **`/api/health`**  
  Both return `200` and `{ "ok": true }`. Use **`/health`** for Render health checks (defined in `backend/app.js` before the `/api` router).

### Required environment variables

| Variable | Description | Secret |
|----------|-------------|--------|
| `NODE_ENV` | `production` | No |
| `PORT` | Set by Render; optional override | No |
| `JWT_SECRET` | JWT signing secret (32+ chars) | **Yes** |
| `DB_URI` | MongoDB Atlas SRV connection string | **Yes** |
| `REFRESH_PEPPER` | Pepper for refresh token hashing | **Yes** |
| `WS_PATH` | WebSocket path, e.g. `/ws` (must match frontend) | No |
| `CORS_ORIGIN` or `CORS_ORIGINS` | At least one: frontend origin(s), e.g. `https://your-frontend.onrender.com` | No |
| `METRICS_SECRET` | Required in prod when metrics mode is `secret` (default); header `x-metrics-key` | **Yes** |
| `ROOT_ADMIN_EMAIL` | Root admin email ensured at startup | No |
| `ROOT_ADMIN_PASSWORD` | Root admin bootstrap password | **Yes** |

Optional (with safe defaults):

| Variable | Description | Default |
|----------|-------------|---------|
| `COOKIE_DOMAIN` | Leave blank for default Vercel + Render URLs; use only for custom shared domains | blank |
| `DISABLE_REDIS` | Set `true` for one-instance deploy without Redis | blank/false |
| `REDIS_URL` | Render Key Value internal URL when using Redis | — |
| `METRICS_MODE` | `open` / `secret` / `admin` / `disabled` | Prod: `secret` |
| `HTTP_BODY_LIMIT` | JSON/urlencoded body limit | `256kb` |
| `JWT_COOKIE_NAME` | Cookie name for access token | `token` |

**Do not set on Render (dev-only):** `DEV_TOKEN_MODE`, `ENABLE_DEV_ROUTES`, `DEV_ROUTES_KEY`, `DEV_SESSION_KEY`, `ALLOW_LOCAL_DB`.

---

## 2. Frontend — Render Static Site

### Build command
- **`npm install && npm run build`**  
  Run from the **frontend app root** (see Publish directory below).

### Publish directory
- **`dist`**  
  Set Render "Root Directory" to **`frontend`** so that build runs in that folder and output is `dist`.

### Required build-time environment variables

The current Thread production build requires explicit backend URLs:

| Variable | Description |
|----------|-------------|
| `VITE_BACKEND_HTTP_URL` | Backend origin, e.g. `https://your-backend.onrender.com` (no trailing slash). Required by production build. |
| `VITE_BACKEND_WS_URL` | Full WebSocket URL, e.g. `wss://your-backend.onrender.com/ws`. Required by production build. |

Optional (defaults are safe):

| Variable | Description |
|----------|-------------|
| `VITE_ENABLE_WS` | Set to `true` to enable WebSocket in UI | `true` |
| `VITE_BACKEND_PORT` | Dev only (Vite proxy); not used in production build | — |

**Never set in production build:** `VITE_DEV_TOKEN_MODE` (code throws in prod if set). Do not set `VITE_DEV_TOKEN_MODE` in Render env for the frontend build.

---

## 3. Cookie / CORS — “If/Then” notes

### If using httpOnly cookies (current design)

- **CORS:** Backend uses **`config/origins.js`** only (`CORS_ORIGIN` or `CORS_ORIGINS`). **`ALLOWED_ORIGINS` is deprecated and ignored.**  
- **Credentials:** CORS middleware sets `Access-Control-Allow-Credentials: true` when `Origin` is allowed (`backend/http/middleware/cors.middleware.js`).  
- **Cookie settings:** `backend/config/cookieConfig.js`: in production, `Secure` is true, `SameSite` is `None` by default, and `Domain` is omitted unless `COOKIE_DOMAIN` is set.

### Recommended COOKIE_DOMAIN on Render

- **Do not set `COOKIE_DOMAIN=.onrender.com`.** That would share cookies across all `*.onrender.com` and is insecure.
- **Preferred:**  
  - **Default Vercel + Render URLs:** leave `COOKIE_DOMAIN` blank so the browser stores host-only cookies for the backend.
  - **Custom domain (split deploy):** If you use e.g. `app.mycompany.com` (static) and `api.mycompany.com` (backend), set `COOKIE_DOMAIN=.mycompany.com` so the cookie is sent to both.

---

## 4. Code changes made (minimal, required for deploy/safety)

### 4.1 Backend: use `WS_PATH` when attaching WebSocket server

**File:** `backend/server.js`

**Reason:** `env.validate.js` requires `WS_PATH` in production, but the server was not passing it to the WebSocket server, so the upgrade path was always `/ws`. Render (and any proxy) must match the path.

**Change:** Pass `path` from env when attaching the WebSocket server:

```diff
-  const wsCore = attachWebSocketServer(server);
+  const wsPath = process.env.WS_PATH || '/ws';
+  const wsCore = attachWebSocketServer(server, { path: wsPath });
```

### 4.2 Frontend: explicit backend URLs for split deploy

**File:** `frontend/src/lib/http.js`, `frontend/src/config/ws.js`, `frontend/src/main.jsx`

**Reason:** In a split deploy (Static Site + Web Service), the browser must send API and WebSocket requests to the backend origin.

**Current behavior:** Production builds require these build-time variables:

```bash
VITE_BACKEND_HTTP_URL=https://your-backend.onrender.com
VITE_BACKEND_WS_URL=wss://your-backend.onrender.com/ws
```

---

## 5. Audit consistency (verified)

- **Export uses textContent only:** `frontend/src/components/settings/SettingsModal.jsx` (historical path in earlier audits): export/print use `textContent` for message content; no `innerHTML`/`document.write` for user content.
- **metricsAccessGuard:** `backend/http/middleware/metricsAccess.middleware.js` enforces `x-metrics-key` in production when mode is `secret`; `METRICS_SECRET` required by `config/env.validate.js` in that case.
- **env.validate production list:** Includes `NODE_ENV`, `PORT`, `JWT_SECRET`, `DB_URI`, `REFRESH_PEPPER`, `WS_PATH`, `ROOT_ADMIN_EMAIL`, `ROOT_ADMIN_PASSWORD`, and at least one of `CORS_ORIGIN`/`CORS_ORIGINS`/`CORS_ORIGIN_PATTERNS`.
- **Body limit:** `backend/http/index.js` uses `BODY_LIMIT = process.env.HTTP_BODY_LIMIT || '256kb'` for `express.json` and `express.urlencoded` (lines 67–71).
- **Origin guard:** Uses only CORS_ORIGIN/CORS_ORIGINS via `config/origins.js`; ALLOWED_ORIGINS is deprecated/ignored.
- **Dev-only flags:** `DEV_TOKEN_MODE` is blocked in production in `env.validate.js`. Dev routes are only mounted when `ENABLE_DEV_ROUTES=true` and `DEV_ROUTES_KEY` or `DEV_SESSION_KEY` is set; do not set these on Render.
- **WS upgrade logging:** Full request URL is only logged in dev (`isDev` block in `backend/websocket/connection/wsServer.js`); production does not log tokens or full URL with query.

---

## 6. Local verification steps

Run from repo root.

### Backend

1. **Env and start**
   ```bash
   cd backend
   cp .env.example .env
   # Set NODE_ENV=development, PORT=8000, JWT_SECRET=test, DB_URI=..., REFRESH_PEPPER=test, COOKIE_DOMAIN=, CORS_ORIGIN=http://localhost:5173, WS_PATH=/ws (and METRICS_SECRET if NODE_ENV=production)
   npm run dev
   ```
2. **Health**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health
   curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health
   ```
   **Success:** Both return `200`.
3. **WebSocket path**
   - With `WS_PATH=/ws`, connect to `ws://localhost:8000/ws` (e.g. browser or `wscat`). Connection should upgrade.
   - With `WS_PATH=/custom`, only `ws://localhost:8000/custom` should upgrade; `/ws` should not.
4. **Body limit**
   ```bash
   curl -s -X POST http://localhost:8000/api/login -H "Content-Type: application/json" -d '{"a":"'$(python3 -c 'print("x"*300000)')'"}' -w "%{http_code}"
   ```
   **Success:** `413` or `PAYLOAD_TOO_LARGE` when over limit.

### Frontend

1. **Build (split deploy simulation)**
   ```bash
   cd frontend
   VITE_BACKEND_HTTP_URL=https://your-backend.onrender.com VITE_BACKEND_WS_URL=wss://your-backend.onrender.com/ws npm run build
   ```
   **Success:** Build completes; production bundle has explicit backend HTTP and WS URLs.
2. **Dev token mode guard**
   - Production build with `VITE_DEV_TOKEN_MODE=true` should throw at runtime (fail-fast in `tokenTransport.js`). Optional: verify by building with that env and opening the app.

### Full stack (same-origin dev)

1. Backend: `cd backend && npm run dev` (e.g. PORT=8000).
2. Frontend: `cd frontend && npm run dev` (Vite proxy to backend).
3. Open `http://localhost:5173`, log in, open a chat, confirm WebSocket connects and messages send/receive.
4. **Success:** No CORS/credential errors; WS connects; messages work.

---

## 7. What success looks like

- Backend starts with production env (required vars set); `/health` and `/api/health` return 200.
- WebSocket upgrades only on the configured `WS_PATH` (e.g. `/ws`).
- Frontend build with `VITE_BACKEND_HTTP_URL` and `VITE_BACKEND_WS_URL` set produces a bundle that calls the backend and connects WS to the backend with wss in production.
- No logging of tokens or full request URLs with query in production WS upgrade path.
- Export/print use only `textContent` for user message content; metrics are protected by secret header in prod; body limit and CORS/origin config match the audit.
