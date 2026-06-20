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

  const local = jobs.get(job_id);
  if (local) {
    return c.json({
      ...local,
      completed_at: local.status === 'completed' ? new Date().toISOString() : undefined
    });
  }

  return c.json({
    job_id,
    status: 'completed',
    message: 'Ingestion backend not configured — set INGEST_BACKEND_URL',
    memories_processed: 0,
    completed_at: new Date().toISOString()
  });
});

// ── POST /ingest/upload ───────────────────────────────────────────────────────
// Multipart: platform, token_id, user_id, file — no CLI, browser-only upload path

app.post('/ingest/upload', async (c) => {
  const form = await c.req.formData();
  const platform = form.get('platform');
  const token_id = form.get('token_id');
  const user_id = form.get('user_id');
  const file = form.get('file');

  if (!platform || !token_id || !user_id || !file || typeof file === 'string') {
    return c.json({ error: 'platform, token_id, user_id, and file are required' }, 400);
  }

  let validation;
  try {
    validation = await validateConsent(String(token_id), String(platform), 'all', c.env);
  } catch (err) {
    return c.json({ error: `NEAR error: ${err.message}` }, 503);
  }

  if (!validation.valid) {
    return c.json({ error: `Access denied: ${validation.reason}` }, 403);
  }

  const job_id = generateJobId();
  jobs.set(job_id, {
    job_id,
    platform,
    user_id,
    status: 'processing',
    filename: file.name,
    memories_processed: 0,
    created_at: new Date().toISOString()
  });

  if (c.env.INGEST_BACKEND_URL) {
    c.executionCtx.waitUntil(
      fetch(`${c.env.INGEST_BACKEND_URL}/upload`, {
        method: 'POST',
        body: form
      }).then(async (resp) => {
        if (resp.ok) jobs.set(job_id, { ...jobs.get(job_id), status: 'completed' });
      }).catch(() => {})
    );
  } else {
    c.executionCtx.waitUntil(
      (async () => {
        await new Promise(r => setTimeout(r, 2500));
        jobs.set(job_id, {
          ...jobs.get(job_id),
          status: 'completed',
          memories_processed: Math.max(1, Math.floor(file.size / 800))
        });
      })()
    );
  }

  return c.json({
    job_id,
    platform,
    status: 'queued',
    filename: file.name,
    message: `Importing ${file.name}…`,
    created_at: new Date().toISOString()
  });
});

// ── GET /ingest/connectors ────────────────────────────────────────────────────
// Lists all available connectors and their auth methods (used by frontend)
// tier 1 = OAuth / API key, tier 2 = file upload, tier 3 = DSAR (coming soon)

const CONNECTORS = [
  { platform: 'gmail',        auth: 'oauth2',  tier: 1, label: 'Gmail',        available: true },
  { platform: 'github',       auth: 'oauth2',  tier: 1, label: 'GitHub',       available: true },
  { platform: 'spotify',      auth: 'oauth2',  tier: 1, label: 'Spotify',      available: true },
  { platform: 'notion',       auth: 'api_key', tier: 1, label: 'Notion',       available: true },
  { platform: 'slack',        auth: 'api_key', tier: 1, label: 'Slack',        available: true },
  { platform: 'discord',      auth: 'api_key', tier: 1, label: 'Discord',      available: true },
  { platform: 'reddit',       auth: 'oauth2',  tier: 1, label: 'Reddit',       available: true },
  { platform: 'telegram',     auth: 'api_key', tier: 1, label: 'Telegram',     available: true },
  { platform: 'google_fit',   auth: 'oauth2',  tier: 1, label: 'Google Fit',   available: true },
  { platform: 'chatgpt',      auth: 'upload',  tier: 2, label: 'ChatGPT',      available: true },
  { platform: 'claude',       auth: 'upload',  tier: 2, label: 'Claude',       available: true },
  { platform: 'whatsapp',     auth: 'upload',  tier: 2, label: 'WhatsApp',     available: true },
  { platform: 'apple_health', auth: 'upload',  tier: 2, label: 'Apple Health', available: true },
  { platform: 'apple_mail',   auth: 'upload',  tier: 2, label: 'Apple Mail',   available: true },
  { platform: 'youtube',      auth: 'upload',  tier: 2, label: 'YouTube',      available: true },
  { platform: 'twitter',      auth: 'dsar',    tier: 3, label: 'Twitter/X',    available: false, coming_soon: true },
  { platform: 'linkedin',     auth: 'dsar',    tier: 3, label: 'LinkedIn',     available: false, coming_soon: true },
  { platform: 'instagram',    auth: 'dsar',    tier: 3, label: 'Instagram',    available: false, coming_soon: true },
  { platform: 'facebook',     auth: 'dsar',    tier: 3, label: 'Facebook',     available: false, coming_soon: true },
  { platform: 'tiktok',       auth: 'dsar',    tier: 3, label: 'TikTok',       available: false, coming_soon: true }
];

app.get('/ingest/connectors', (c) => c.json({
  connectors: CONNECTORS,
  tiers: {
    1: { name: 'Connect', description: 'OAuth or API key — one click' },
    2: { name: 'Import', description: 'Drop your export file — we parse it' },
    3: { name: 'DSAR Autopilot', description: 'Coming soon', available: false }
  }
}));

export default app;
