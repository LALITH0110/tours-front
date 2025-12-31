# Neon Database Setup

Use the SQL in `database/schema.sql` to create the tables in Neon.

## Steps (once you create the Neon project)
1. In Neon, create a new project and grab the connection string.
2. Open the SQL editor in Neon.
3. Paste the contents of `database/schema.sql` and run it.
4. Save the connection string for later use in the app (env var).

## Local setup for serverless API routes
```bash
cd database
pnpm install
```

## Notes
- This schema matches the current in-memory data model.
- The `settings` table is designed for a single row (id = 1).
- Set `DATABASE_URL` in `frontend/.env.local`.
