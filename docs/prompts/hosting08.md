# Prompt: Hosting and deployment

Unchanged from the earlier plan, with one addition for the low-connectivity module.

## Stack
- **Frontend + API routes**: Vercel
- **Database**: Neon or Supabase
- **Socket.io server**: Render or Railway if it needs to be a separate always-on process outside Vercel's serverless functions
- **Web Push (if built)**: no extra hosting needed — it's a browser API backed by the browser vendor's own push service (e.g. Google's for Chrome), you just need VAPID keys generated and stored as env vars

## Setup
1. `.env.example` with all required keys: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SOCKET_SERVER_URL`, `ANTHROPIC_API_KEY`, and `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` if Web Push is built.
2. `npx prisma migrate deploy` as part of the production build step.
3. Vercel preview deployments per branch/PR so each teammate can demo independently.
4. CORS: explicitly allow the Vercel domain on the separately-hosted socket server.
5. Smoke test the full flow against the deployed URL before presenting — registration, event creation, venue change, cancellation, visitor schedule update, AI features — not just localhost.

## Coordination points
- With realtime module: confirm the deployed `SOCKET_SERVER_URL` early.
- With auth module: confirm OAuth redirect URIs for the deployed domain, not just localhost.
