# Deploying Upriser to Vercel

> A step-by-step guide to deploy this full-stack Express + React application on Vercel.

---

## Architecture Overview

Upriser is a **monorepo** with a unified build process:

| Layer | Tech | Output |
|-------|------|--------|
| Client | Vite + React + Tailwind | `dist/public/` (static assets) |
| Server | Express + esbuild | `dist/index.cjs` (bundled Node.js) |
| Database | PostgreSQL + Drizzle ORM | Supabase or any PostgreSQL provider |
| Storage | Supabase Storage | File uploads (past papers, resources) |

The `npm run build` command builds **both** client and server into the `dist/` directory.

---

## Prerequisites

Before deploying, ensure you have:

1. A [Vercel account](https://vercel.com/signup)
2. The [Vercel CLI](https://vercel.com/docs/cli) installed (`npm i -g vercel`)
3. A **PostgreSQL database** (recommended: [Supabase](https://supabase.com), [Neon](https://neon.tech), or [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres))
4. (Optional) A [Google Cloud Console](https://console.cloud.google.com/) project for OAuth

---

## Step 1: Prepare the Project

### 1.1 Create `vercel.json`

Create a `vercel.json` file in the project root:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/public/$1" }
  ],
  "functions": {
    "dist/index.cjs": {
      "runtime": "nodejs20.x",
      "maxDuration": 30
    }
  }
}
```

> **Note:** Since Upriser uses a custom Express server (not a framework like Next.js), you should set `"framework": null` in both `vercel.json` and the Vercel dashboard.

### 1.2 Push Schema to Database

Before deploying, push your database schema:

```bash
DATABASE_URL="your-production-database-url" npm run db:push
```

This runs `drizzle-kit push` to sync your schema (defined in `shared/schema.ts`) with the production database.

---

## Step 2: Configure Environment Variables

Go to your Vercel project → **Settings** → **Environment Variables** and add:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `SESSION_SECRET` | Secret for signing session cookies (random 32+ chars) | `a1b2c3d4e5f6...` |
| `NODE_ENV` | Must be `production` | `production` |

### Admin & Teacher Seed Credentials

| Variable | Description | Default (if unset) |
|----------|-------------|--------------------|
| `ADMIN_EMAIL` | Admin user email | `admin@upriser.com` |
| `ADMIN_PASSWORD` | Admin user password | `admin123` |
| `ADMIN_NAME` | Admin display name | `System Administrator` |
| `TEACHER_EMAIL` | Demo teacher email | `teacher@upriser.com` |
| `TEACHER_PASSWORD` | Demo teacher password | `teacher123` |
| `TEACHER_NAME` | Demo teacher name | `Demo Teacher` |

> **⚠️ Important:** Always set these in production. The defaults are insecure.

### Google OAuth (Optional)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://your-domain.vercel.app/api/auth/google/callback` |

### Supabase Storage (Optional)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (not the anon key) |

### CORS Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `CLIENT_URL` | Allowed frontend origin(s), comma-separated | `https://your-domain.vercel.app` |

---

## Step 3: Deploy

### Option A: Deploy via Vercel CLI

```bash
# Login to Vercel
vercel login

# Link your project (first time only)
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option B: Deploy via GitHub Integration

1. Push your code to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repo
3. Set **Framework Preset** to `Other`
4. Set **Build Command** to `npm run build`
5. Set **Output Directory** to `dist`
6. Set **Install Command** to `npm install`
7. Add all environment variables from Step 2
8. Click **Deploy**

---

## Step 4: Post-Deployment Checklist

- [ ] Visit `https://your-domain.vercel.app` — homepage should load
- [ ] Test login with admin credentials
- [ ] Test Google OAuth (if configured) — ensure callback URL matches
- [ ] Check the Vercel **Functions** tab for server-side logs
- [ ] Verify `CLIENT_URL` matches your actual Vercel domain (for CORS)

---

## Important Notes

### Serverless Limitations

Vercel runs your Express server as a **serverless function**. Be aware of:

- **Cold starts:** First request after idle may take 1–3s
- **Timeout:** Default 10s (configurable up to 30s on Pro, 300s on Enterprise)
- **No persistent state:** In-memory session store won't work — use `DATABASE_URL` to enable PostgreSQL-backed sessions automatically
- **No WebSocket support:** If you need real-time features, consider a separate WebSocket provider

### Session Store

The app automatically uses PostgreSQL sessions (`connect-pg-simple`) when `DATABASE_URL` is set, and falls back to in-memory sessions otherwise. For production, **always set `DATABASE_URL`** so sessions persist across serverless invocations.

### Build Process

The build process (`npm run build`) does two things:

1. **Client:** Vite builds the React app to `dist/public/`
2. **Server:** esbuild bundles the Express server to `dist/index.cjs`

Both outputs go into the `dist/` directory, which Vercel serves.

### Custom Domain

To add a custom domain:

1. Go to Vercel project → **Settings** → **Domains**
2. Add your domain and configure DNS as instructed
3. Update `CLIENT_URL` env var to include the new domain
4. Update `GOOGLE_CALLBACK_URL` if using Google OAuth

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `DATABASE_URL` not found | Ensure the env var is set in Vercel dashboard for all environments |
| CORS errors | Set `CLIENT_URL` to your Vercel domain (e.g., `https://upriser.vercel.app`) |
| Google OAuth redirect mismatch | Update `GOOGLE_CALLBACK_URL` to `https://your-domain.vercel.app/api/auth/google/callback` |
| Session not persisting | Ensure `DATABASE_URL` is set — the app auto-uses PostgreSQL sessions |
| Build fails | Run `npm run build` locally first to debug. Check `script/build.ts` for the build pipeline |
| Static files not served | Verify `dist/public/` is populated after build and `vercel.json` rewrites are correct |
