import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createMemoryStore } from '../src/store/memory.js';

const makeApp = () => createApp({ store: createMemoryStore(), baseUrl: 'http://test' });

test('GET /healthz returns ok', async () => {
  const res = await request(makeApp()).get('/healthz');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: 'ok' });
});

test('POST /api/links creates a short link', async () => {
  const res = await request(makeApp()).post('/api/links').send({ url: 'https://example.com' });
  assert.equal(res.status, 201);
  assert.match(res.body.code, /^[A-Za-z0-9_-]{7}$/);
  assert.equal(res.body.shortUrl, `http://test/${res.body.code}`);
});

test('POST /api/links rejects invalid URLs', async () => {
  for (const url of ['not a url', 'ftp://example.com', 'javascript:alert(1)', undefined]) {
    const res = await request(makeApp()).post('/api/links').send({ url });
    assert.equal(res.status, 400, `expected 400 for ${url}`);
  }
});

test('GET /:code redirects and counts clicks', async () => {
  const app = makeApp();
  const { body } = await request(app).post('/api/links').send({ url: 'https://example.com' });

  const redirect = await request(app).get(`/${body.code}`);
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.location, 'https://example.com');

  const stats = await request(app).get(`/api/links/${body.code}`);
  assert.equal(stats.body.clicks, 1);
});

test('unknown codes return 404', async () => {
  const res = await request(makeApp()).get('/api/links/nope123');
  assert.equal(res.status, 404);
});
