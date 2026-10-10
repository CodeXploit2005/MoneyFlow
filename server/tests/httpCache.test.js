import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

test('API responses retain JSON with conditional cache headers and are never cached', async () => {
 const server = app.listen(0, '127.0.0.1');
 await new Promise(resolve => server.once('listening', resolve));
 try {
  const url = `http://127.0.0.1:${server.address().port}/api/health`;
  for (const headers of [{}, { 'If-None-Match': '*', 'If-Modified-Since': 'Thu, 01 Jan 2099 00:00:00 GMT' }]) {
   const result = await fetch(url, { headers });
   assert.equal(result.status, 503);
   assert.equal(result.headers.get('cache-control'), 'no-store');
   assert.equal(result.headers.get('etag'), null);
   const body = await result.json();
   assert.equal(body.app, 'MoneyFlow API');
   assert.equal(body.status, 'unavailable');
  }
 } finally { await new Promise(resolve => server.close(resolve)); }
});

test('Disconnected database rejects login promptly instead of buffering it', async () => {
 const server = app.listen(0, '127.0.0.1');
 await new Promise(resolve => server.once('listening', resolve));
 try {
  const result = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/login`, {
   method: 'POST', headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ email: 'test@example.com', password: 'unused' }),
   signal: AbortSignal.timeout(2000)
  });
  assert.equal(result.status, 503);
  assert.equal(result.headers.get('retry-after'), '5');
  assert.match((await result.json()).message, /cơ sở dữ liệu/);
 } finally { await new Promise(resolve => server.close(resolve)); }
});
