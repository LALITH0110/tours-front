# Campus Tours Frontend

Next.js app wired to the backend API.

## Run
```bash
cd frontend
pnpm install
pnpm dev
```

Set `NEXT_PUBLIC_API_BASE_URL` if your backend runs on a different host/port (defaults to `/api` for serverless routes).

Database:
- Copy `frontend/.env.local.example` to `frontend/.env.local`
- Set `DATABASE_URL` to your Neon connection string
