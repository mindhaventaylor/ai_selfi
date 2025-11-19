# Vercel Deployment Guide

## Overview
This app is configured to deploy on Vercel with:
- Static files served from `dist/public` (built by Vite)
- Express server running as a Vercel serverless function
- API routes handled by Express
- SPA fallback for client-side routing

## Build Process
1. `pnpm build` runs:
   - `vite build` - builds client to `dist/public`
   - `esbuild server/_core/index.ts` - bundles server to `dist/index.js`

## Vercel Configuration
- **Build Command**: `pnpm build`
- **Output Directory**: `dist/public`
- **API Handler**: `api/index.ts` (compiled by Vercel)
- **Runtime**: Node.js 18+ (via `@vercel/node@3`)

## File Structure
```
├── api/
│   └── index.ts          # Vercel serverless function entry point
├── dist/
│   ├── index.js          # Bundled Express server
│   └── public/           # Built client files (served as static)
├── server/
│   └── _core/
│       └── index.ts      # Express app factory
└── vercel.json           # Vercel configuration
```

## How It Works
1. Static assets (JS, CSS, images) are served directly from `dist/public`
2. API routes (`/api/*`) are handled by the Express serverless function
3. All other routes fall back to the Express app, which serves `index.html` for SPA routing

## Environment Variables
Make sure to set these in Vercel:
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `JWT_SECRET`
- `OAUTH_SERVER_URL`
- `OWNER_OPEN_ID`
- Any other required env vars from `server/_core/env.ts`

## Troubleshooting
- If you see bundled code instead of the app: Check that `vercel.json` routes are correct
- If API routes don't work: Verify `api/index.ts` is importing correctly
- If static files don't load: Check `outputDirectory` in `vercel.json`

