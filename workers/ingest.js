// workers/ingest.js
// Cloudflare Worker — ingestion trigger endpoint
// Accepts requests to trigger platform ingestion jobs
// Actual Python ingestion runs on a server; this worker fans out the trigger

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { validateConsent } from './consent-gate.js';

const app = new Hono();
app.use('*', cors());

// In-memory job store (Durable Objects would be used in production)
const jobs = new Map();

function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ── POST /ingest/trigger ──────────────────────────────────────────────────────
// Body: { user_id, platform, token_id, credentials? }
// Validates the Consent NFT, creates a job, forwards to ingestion backend if configured

app.post('/ingest/trigger', async (c) => {
  const { user_id, platform, token_id } = await c.req.json();

  if (!user_id || !platform || !token_id) {
    return c.json({ error: 'user_id, platform, token_id are required' }, 400);
  }

  let validation;
  try {
    validation = await validateConsent(token_id, platform, 'all', c.env);
  } catch (err) {
    return c.json({ error: `NEAR error: ${err.message}` }, 503);
  }

  if (!validation.valid) {
    return c.json({ error: `Access denied: ${validation.reason}` }, 403);
  }

  const job_id = generateJobId();

  // Forward to Python ingestion backend if INGEST_BACKEND_URL is set
  if (c.env.INGEST_BACKEND_URL) {
    c.executionCtx.waitUntil(
      fetch(`${c.env.INGEST_BACKEND_URL}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id, user_id, platform, token_id })
      }).catch(() => {})
    );
  }

  return c.json({
    job_id,
    user_id,
    platform,
    status: 'queued',
    message: `Ingestion job queued for ${platform}. Check /ingest/status/${job_id} for progress.`,
    created_at: new Date().toISOString()
  });
});

// ── POST /ingest/trigger/batch ────────────────────────────────────────────────
// Body: { user_id, platforms: string[], token_id }
// Triggers ingestion for multiple platforms at once

app.post('/ingest/trigger/batch', async (c) => {
  const { user_id, platforms, token_id } = await c.req.json();

  if (!user_id || !Array.isArray(platforms) || !token_id) {
    return c.json({ error: 'user_id, platforms (array), token_id are required' }, 400);
  }

  let validation;
  try {
    validation = await validateConsent(token_id, 'all', 'all', c.env);
  } catch (err) {
    return c.json({ error: `NEAR error: ${err.message}` }, 503);
  }

  if (!validation.valid) {
    return c.json({ error: `Access denied: ${validation.reason}` }, 403);
  }

  const jobs_created = platforms.map(platform => {
    const job_id = generateJobId();
    if (c.env.INGEST_BACKEND_URL) {
      c.executionCtx.waitUntil(
        fetch(`${c.env.INGEST_BACKEND_URL}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id, user_id, platform, token_id })
        }).catch(() => {})
      );
    }
    return { job_id, platform, status: 'queued' };
  });

  return c.json({ user_id, jobs: jobs_created, created_at: new Date().toISOString() });
});

// ── GET /ingest/status/:job_id ────────────────────────────────────────────────

app.get('/ingest/status/:job_id', async (c) => {
  const job_id = c.req.param('job_id');

  // If INGEST_BACKEND_URL is set, proxy to Python backend
  if (c.env.INGEST_BACKEND_URL) {
    try {
      const resp = await fetch(`${c.env.INGEST_BACKEND_URL}/status/${job_id}`);
      const data = await resp.json();
      return c.json(data, resp.status);
    } catch {
      return c.json({ job_id, status: 'unknown', error: 'Backend unreachable' }, 503);
    }
  }

  // Stub response when no backend is configured
  return c.json({
    job_id,
    status: 'completed',
    message: 'Ingestion backend not configured — set INGEST_BACKEND_URL',
    memories_processed: 0,
    completed_at: new Date().toISOString()
  });
});

// ── GET /ingest/connectors ────────────────────────────────────────────────────
// Lists all available connectors and their auth methods (used by frontend)

app.get('/ingest/connectors', (c) => c.json({
  connectors: [
    { platform: 'gmail',        auth: 'oauth2',  label: 'Gmail',        available: true },
    { platform: 'github',       auth: 'oauth2',  label: 'GitHub',       available: true },
    { platform: 'spotify',      auth: 'oauth2',  label: 'Spotify',      available: true },
    { platform: 'notion',       auth: 'api_key', label: 'Notion',       available: true },
    { platform: 'slack',        auth: 'api_key', label: 'Slack',        available: true },
    { platform: 'discord',      auth: 'api_key', label: 'Discord',      available: true },
    { platform: 'reddit',       auth: 'oauth2',  label: 'Reddit',       available: true },
    { platform: 'telegram',     auth: 'api_key', label: 'Telegram',     available: true },
    { platform: 'chatgpt',      auth: 'upload',  label: 'ChatGPT',      available: true },
    { platform: 'claude',       auth: 'upload',  label: 'Claude',       available: true },
    { platform: 'whatsapp',     auth: 'upload',  label: 'WhatsApp',     available: true },
    { platform: 'apple_health', auth: 'upload',  label: 'Apple Health', available: true },
    { platform: 'apple_mail',   auth: 'upload',  label: 'Apple Mail',   available: true },
    { platform: 'youtube',      auth: 'upload',  label: 'YouTube',      available: true },
    { platform: 'twitter',      auth: 'dsar',    label: 'Twitter/X',    available: true },
    { platform: 'linkedin',     auth: 'dsar',    label: 'LinkedIn',     available: true },
    { platform: 'instagram',    auth: 'dsar',    label: 'Instagram',    available: true },
    { platform: 'facebook',     auth: 'dsar',    label: 'Facebook',     available: true },
    { platform: 'tiktok',       auth: 'dsar',    label: 'TikTok',       available: true },
    { platform: 'google_fit',   auth: 'oauth2',  label: 'Google Fit',   available: true }
  ]
}));

export default app;
