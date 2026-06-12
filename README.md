# Thread

Thread is a full-stack real-time chat app with a Node/Express/WebSocket backend, a React/Vite frontend, and MongoDB persistence.

---

## Deploy on Render

Render deployment uses **no Dockerfile**: backend runs via **Start Command**, frontend as a **Static Site**.

- **Backend:** Web Service; root directory `backend`, start command `node server.js`, health path `/health`, WebSocket path `/ws`.
- **Frontend:** Static Site; root directory `frontend`, build `npm install && npm run build`, publish `dist`.

Full instructions, env vars, and cookie/CORS notes: **[docs/deploy/RENDER.md](docs/deploy/RENDER.md)**.

## Deploy like the Vercel app

The live Vercel URL uses a static frontend with a separate backend origin. For the same setup with Thread, deploy `frontend/` on Vercel and `backend/` on Render.

- **Frontend:** Vercel project root `frontend`, build `npm install && npm run build`, output `dist`.
- **Frontend env:** `VITE_BACKEND_HTTP_URL=https://<your-backend>.onrender.com`, `VITE_BACKEND_WS_URL=wss://<your-backend>.onrender.com/ws`.
- **Backend:** Render Web Service root `backend`, start command `node server.js`, health path `/health`.
- **Backend env:** set `CORS_ORIGIN` to the Vercel frontend URL and set `WS_PATH=/ws`.

Step-by-step instructions: **[docs/deploy/VERCEL_FRONTEND_RENDER_BACKEND.md](docs/deploy/VERCEL_FRONTEND_RENDER_BACKEND.md)**.

---

## Docs

Single entry point for all project documentation: **[docs/00_INDEX.md](docs/00_INDEX.md)**.

- **Deployment:** [docs/deploy/RENDER.md](docs/deploy/RENDER.md), precheck, readiness audit.
- **Security:** Security audit, checklists, secrets policy, env template under `docs/security/` and `docs/`.
- **Legacy:** Nginx/systemd/AWS material (not used on Render) under `docs/legacy/` and `infra/legacy/`.

---

## Local development

- **Backend:** `cd backend && npm install && npm run dev` (see `backend/.env.example`).
- **Frontend:** `cd frontend && npm install && npm run dev`.
- Use `http://localhost:5173` with backend e.g. on port 8000; see [docs/config/ENV_TEMPLATE.md](docs/config/ENV_TEMPLATE.md) for env contract.
