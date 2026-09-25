import express from 'express';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

function isValidUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

// 5 random bytes -> 7 URL-safe characters, e.g. "aB3xY9q"
const newCode = () => randomBytes(5).toString('base64url');

// The app is built by a function that receives its dependencies (store, logger).
// Tests pass in a fresh in-memory store; production passes in the real one.
export function createApp({ store, baseUrl, logger }) {
  const app = express();
  app.disable('x-powered-by'); // Don't advertise the framework to attackers
  app.use(express.json({ limit: '10kb' }));
  if (logger) app.use(logger);
  app.use(express.static(publicDir));

  app.get('/healthz', async (req, res) => {
    await store.ping();
    res.json({ status: 'ok' });
  });

  app.post('/api/links', async (req, res) => {
    const url = req.body?.url;
    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Provide a valid http(s) URL in "url"' });
    }
    let code;
    do {
      code = newCode();
    } while (await store.get(code)); // Retry on the (very rare) collision
    const link = await store.create(code, url);
    res.status(201).json({ ...link, shortUrl: `${baseUrl}/${code}` });
  });

  app.get('/api/links/:code', async (req, res) => {
    const link = await store.get(req.params.code);
    if (!link) return res.status(404).json({ error: 'Link not found' });
    res.json(link);
  });

  app.get('/:code', async (req, res) => {
    const link = await store.get(req.params.code);
    if (!link) return res.status(404).send('Link not found');
    await store.incrementClicks(link.code);
    res.redirect(302, link.url);
  });

  // Last-resort error handler: log server errors, never leak stack traces to users
  app.use((err, req, res, _next) => {
    const status = err.status ?? 500;
    if (status >= 500) req.log?.error(err);
    res.status(status).json({ error: status < 500 ? err.message : 'Internal server error' });
  });

  return app;
}
