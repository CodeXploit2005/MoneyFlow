import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenNeedsRefresh, singleFlight } from '../src/api/session.ts';
const token = exp => 'header.' + Buffer.from(JSON.stringify({ exp })).toString('base64url') + '.signature';
test('Refresh before expiration, not on every request', () => {
 const now=1_000_000;
 assert.equal(tokenNeedsRefresh(token(1020),now),true);
 assert.equal(tokenNeedsRefresh(token(999),now),true);
 assert.equal(tokenNeedsRefresh(token(1100),now),false);
 assert.equal(tokenNeedsRefresh('invalid',now),false);
});
test('Concurrent requests share one refresh and later calls can refresh again', async()=>{
 let calls=0, finish;
 const refresh=singleFlight(()=>{calls++;return new Promise(resolve=>{finish=resolve;});});
 const requests=Array.from({length:10},()=>refresh()); await Promise.resolve(); assert.equal(calls,1);
 finish('fresh-token'); assert.deepEqual(await Promise.all(requests),Array(10).fill('fresh-token'));
 const next=refresh();await Promise.resolve();assert.equal(calls,2);finish('next-token');assert.equal(await next,'next-token');
});
test('Failed refresh rejects all waiters and permits a new attempt',async()=>{
 let calls=0;
 const refresh=singleFlight(async()=>{if(++calls===1)throw new Error('Network unavailable');return 'recovered';});
 const results=await Promise.allSettled([refresh(),refresh(),refresh()]);assert.ok(results.every(r=>r.status==='rejected'));assert.equal(calls,1);
 assert.equal(await refresh(),'recovered');assert.equal(calls,2);
});
