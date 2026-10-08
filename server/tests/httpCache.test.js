import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

test('API responses retain JSON with conditional cache headers and are never cached', async () => {
 app.get('/api/__cache-check', (_req, res) => res.json({ success: true, data: { total: 150000 } }));
 const server = app.listen(0, '127.0.0.1');
 await new Promise(resolve => server.once('listening', resolve));
 try {
  const url = `http://127.0.0.1:${server.address().port}/api/__cache-check`;
  for (const headers of [{}, { 'If-None-Match': '*', 'If-Modified-Since': 'Thu, 01 Jan 2099 00:00:00 GMT' }]) {
   const result = await fetch(url, { headers });
   assert.equal(result.status, 200);
   assert.equal(result.headers.get('cache-control'), 'no-store');
   assert.equal(result.headers.get('etag'), null);
   assert.deepEqual(await result.json(), { success: true, data: { total: 150000 } });
  }
 } finally { await new Promise(resolve => server.close(resolve)); }
});
