# Thread

Thread is a full-stack real-time chat application built for fast, reliable, and secure conversations. It supports authentication, live messaging, persistent chat history, profile updates, admin controls, password reset email flow, and a production-ready split deployment with the frontend on Vercel and the backend on Render.

## Live Links

- **Frontend:** [https://thread-six-kappa.vercel.app](https://thread-six-kappa.vercel.app)
- **Backend:** [https://threadbackend-lvxi.onrender.com](https://threadbackend-lvxi.onrender.com)
- **Health Check:** [https://threadbackend-lvxi.onrender.com/health](https://threadbackend-lvxi.onrender.com/health)
- **Readiness Check:** [https://threadbackend-lvxi.onrender.com/readyz](https://threadbackend-lvxi.onrender.com/readyz)

## Tech Stack

- **Frontend:** React, Vite, Redux Toolkit, TanStack Query, Wouter, Lucide React, Recharts
- **Backend:** Node.js, Express, WebSocket (`ws`), MongoDB driver
- **Database:** MongoDB Atlas
- **Authentication:** JWT cookies, refresh-token flow, bcrypt password hashing
- **Email:** Nodemailer with SMTP for password reset OTP
- **Security:** Helmet, CORS origin allowlisting, production env validation, metrics protection
- **Deployment:** Vercel static frontend, Render Node web service
- **Optional realtime scale layer:** Redis Pub/Sub support for multi-instance WebSocket fanout

## What Powers Thread

### Realtime Messaging Core

Thread uses a dedicated WebSocket layer for live chat delivery. The backend attaches a WebSocket server at `/ws`, tracks active connections, manages rooms, handles heartbeat checks, and keeps message delivery separate from normal HTTP routes.

### Persistent Conversation State

Messages, users, rooms, and admin state are backed by MongoDB Atlas. The backend centralizes MongoDB access through a shared client so the app can reuse one connection pool across services and keep persistence consistent.

### Auth, Sessions, and Access Control

The app uses secure cookie-based authentication with JWT access tokens and refresh-token hashing. Passwords are hashed with bcrypt, admin bootstrap is handled through environment variables, and production startup validates required secrets before the service accepts traffic.

### Operations and Deployment Flow

The frontend is served as a static Vite app from Vercel. The backend runs separately on Render and exposes REST endpoints, WebSocket upgrades, `/health`, and `/readyz`. CORS is explicitly allowlisted so only trusted frontend origins can call the backend.

## How It Works

Users open the Vercel frontend, sign up or log in, and the browser talks to the Render backend over HTTPS for auth and app data. After authentication, the chat experience connects to the backend WebSocket endpoint for realtime updates. Messages are processed by the WebSocket layer, persisted in MongoDB, and reflected back into the UI so conversations stay available after refresh or login from another session.

## Scalability, Rate Limiting, and Reliability

Thread is structured so the realtime layer can grow beyond a single instance. The backend includes WebSocket heartbeat handling, payload limits, rate limiting, connection controls, and Redis Pub/Sub integration for future multi-instance message fanout. For the current resume/demo deployment, Redis is disabled because one Render instance is enough; when traffic grows, Redis can be enabled without changing the client-facing API or WebSocket contract.

## App Impact

Thread demonstrates a production-style chat system rather than a simple UI prototype. It combines live communication, durable storage, secure login, email recovery, admin readiness, deployment health checks, and environment-driven configuration. The result is a practical full-stack project that shows how modern realtime apps are built, deployed, and operated.

## Local Development

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Use `http://localhost:5173` for the frontend. Backend local setup details are documented in [backend/.env.example](backend/.env.example) and [docs/config/ENV_TEMPLATE.md](docs/config/ENV_TEMPLATE.md).

## Deployment Notes

- Render backend root directory: `backend`
- Render build command: `npm install --omit=dev`
- Render start command: `node server.js`
- Render health path: `/health`
- Vercel frontend root directory: `frontend`
- Vercel build command: `npm run build`
- Vercel output directory: `dist`

Full deployment references:

- [docs/deploy/RENDER.md](docs/deploy/RENDER.md)
- [docs/deploy/VERCEL_FRONTEND_RENDER_BACKEND.md](docs/deploy/VERCEL_FRONTEND_RENDER_BACKEND.md)
- [docs/00_INDEX.md](docs/00_INDEX.md)

## Prepared By

Prepared by **Daksh Aggarwal**.
