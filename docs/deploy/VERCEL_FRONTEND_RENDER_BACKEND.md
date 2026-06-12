# Vercel Frontend + Render Backend

This matches the shape of the live Vercel app: a static React/Vite frontend on Vercel that talks directly to a Node/Express/WebSocket backend on Render.

## 1. Backend on Render

Create a Render **Web Service**:

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm install --omit=dev` |
| Start Command | `node server.js` |
| Health Check Path | `/health` |
| WebSocket Path | `/ws` |

Required backend environment variables:

```bash
NODE_ENV=production
PORT=10000
NODE_VERSION=22.16.0
JWT_SECRET=<32+ char random secret>
REFRESH_PEPPER=<32+ char random secret>
DB_URI=<MongoDB Atlas connection string>
DB_NAME=Thread
MONGO_NETWORK_FAMILY=4
MONGO_SERVER_SELECTION_TIMEOUT_MS=30000
MONGO_CONNECT_TIMEOUT_MS=20000
WS_PATH=/ws
CORS_ORIGIN=https://<your-vercel-project>.vercel.app
METRICS_MODE=secret
METRICS_SECRET=<32+ char random secret>
ROOT_ADMIN_EMAIL=<your-admin-email>
ROOT_ADMIN_PASSWORD=<temporary-strong-password>
ROOT_ADMIN_USERNAME=daksh_root
DISALLOW_FILE_STORE=true
```

Render usually provides `PORT`; if it does, use Render's value. Keep `COOKIE_DOMAIN` blank unless you are using a custom shared domain. Keep `DB_NAME` exactly the same case as the Atlas database name.

Redis is optional for a one-instance project deploy:

```bash
DISABLE_REDIS=true
```

For multi-instance scaling, create Render Key Value/Redis instead and set:

```bash
REDIS_URL=<Render Key Value internal URL>
DISABLE_REDIS=false
```

## 2. Frontend on Vercel

Create a Vercel project from the same repository:

| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Build Command | `npm install && npm run build` |
| Output Directory | `dist` |

Required Vercel environment variables:

```bash
VITE_BACKEND_HTTP_URL=https://<your-backend>.onrender.com
VITE_BACKEND_WS_URL=wss://<your-backend>.onrender.com/ws
VITE_ENABLE_WS=true
```

The existing `frontend/vercel.json` sends all browser routes to `index.html`, so `/login`, `/register`, `/chat`, `/settings`, and `/admin` work after refresh.

## 3. After Deploy

1. Open `https://<your-backend>.onrender.com/health` and confirm it returns `200`.
2. Open `https://<your-backend>.onrender.com/readyz` and confirm it returns `ready`.
3. Open your Vercel URL and confirm the browser tab says `Thread`.
4. Register/login, then verify `/chat` connects to WebSocket.
5. If the frontend shows auth or CORS errors, set backend `CORS_ORIGIN` exactly to the Vercel URL, with no trailing slash.

## Notes

- Do not rename API paths, WebSocket message types, or env variable names.
- The app brand is `Thread`; deployment hostnames can still contain older project names until you create new Vercel/Render project names.
- Real secrets belong in Render/Vercel settings, not in committed files.
- If Redis is skipped with `DISABLE_REDIS=true`, keep the Render backend at one instance. Add Redis before scaling to multiple backend instances.
