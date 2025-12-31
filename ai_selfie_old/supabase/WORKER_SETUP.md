# Worker Setup Guide

## Overview

The image generation system now uses a queue-based architecture to avoid rate limits and Edge Function timeouts:

1. **Edge Function (`generate-images`)**: Enqueues jobs instead of processing them
2. **Worker (`process-generation-queue`)**: Processes jobs with proper backoff/jitter

## Database Migration

First, run the migration to create the queue table:

```bash
# Apply migration
psql $DATABASE_URL -f drizzle/migrations/0010_create_generation_queue.sql

# Or use Supabase Dashboard → SQL Editor
```

## Deployment Options

### Option 1: Deploy Worker as Edge Function (Scheduled)

1. Deploy the worker function:
```bash
supabase functions deploy process-generation-queue
```

2. Set up a cron job in Supabase Dashboard:
   - Go to Database → Cron Jobs
   - Create a new cron job that calls the function every minute
   - Or use Supabase's pg_cron extension

### Option 2: Run Worker Locally (Development)

```bash
# Set environment variables
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
export GEMINI_API_KEY=your-gemini-api-key

# Run worker
deno run --allow-net --allow-env supabase/functions/process-generation-queue/index.ts
```

### Option 3: Deploy Worker to Cloud Run (Production)

1. Create a Dockerfile:
```dockerfile
FROM denoland/deno:latest

WORKDIR /app
COPY supabase/functions/process-generation-queue/ ./worker/

CMD ["deno", "run", "--allow-net", "--allow-env", "worker/index.ts"]
```

2. Build and deploy:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/generation-worker
gcloud run deploy generation-worker \
  --image gcr.io/PROJECT_ID/generation-worker \
  --platform managed \
  --set-env-vars SUPABASE_URL=...,SUPABASE_SERVICE_ROLE_KEY=...,GEMINI_API_KEY=...
```

### Option 4: Run Worker on VM/Server

1. Install Deno:
```bash
curl -fsSL https://deno.land/install.sh | sh
```

2. Create a systemd service:
```ini
[Unit]
Description=Photo Generation Queue Worker
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/project
Environment="SUPABASE_URL=https://..."
Environment="SUPABASE_SERVICE_ROLE_KEY=..."
Environment="GEMINI_API_KEY=..."
ExecStart=/usr/local/bin/deno run --allow-net --allow-env supabase/functions/process-generation-queue/index.ts
Restart=always

[Install]
WantedBy=multi-user.target
```

3. Enable and start:
```bash
sudo systemctl enable generation-worker
sudo systemctl start generation-worker
```

## Environment Variables

Required for the worker:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (has admin access)
- `GEMINI_API_KEY`: Google Gemini API key
- `GEMINI_MODEL_NAME`: (Optional) Model name, defaults to `gemini-2.5-flash-image`
- `WORKER_ID`: (Optional) Unique worker identifier, defaults to `worker-{timestamp}`

## Monitoring

Check worker logs:
```bash
# If running locally
# Logs will appear in console

# If deployed to Cloud Run
gcloud run services logs read generation-worker --limit 50

# If using systemd
journalctl -u generation-worker -f
```

Check queue status:
```sql
-- Pending jobs
SELECT COUNT(*) FROM photo_generation_queue WHERE status = 'pending';

-- Rate limited jobs
SELECT COUNT(*), MIN("retryAt") FROM photo_generation_queue WHERE status = 'rate_limited';

-- Processing jobs
SELECT * FROM photo_generation_queue WHERE status = 'processing';
```

## Troubleshooting

### Worker not processing jobs

1. Check if jobs are in the queue:
```sql
SELECT * FROM photo_generation_queue WHERE status IN ('pending', 'rate_limited') ORDER BY "createdAt" LIMIT 10;
```

2. Check for stale locks:
```sql
SELECT * FROM photo_generation_queue 
WHERE status = 'processing' 
AND "lockedAt" < NOW() - INTERVAL '5 minutes';
```

3. Release stale locks:
```sql
UPDATE photo_generation_queue 
SET "lockedBy" = NULL, "lockedAt" = NULL, status = 'pending'
WHERE status = 'processing' 
AND "lockedAt" < NOW() - INTERVAL '5 minutes';
```

### Rate limits still occurring

- Increase delays between images in `process-generation-queue/index.ts`
- Check Gemini API quotas in Google Cloud Console
- Consider upgrading to a paid plan for higher quotas

### Jobs stuck in processing

- Check worker logs for errors
- Manually release locks if needed (see SQL above)
- Restart the worker

