import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileWarrantyClaims } from '../src/utils/warrantyReconciliation.js';

const tx = { _id: 'receipt', saleId: 'sale', type: 'expense', amount: 86000, isDeleted: false };
const claim = { cost: 86000, costTransactionId: 'receipt' };
const check = (claims, transactions = [tx]) => reconcileWarrantyClaims({ _id: 'sale', claims }, transactions);

test('Warranty audit detects 150k versus 86k without mutating history', () => {
  const claims = [{ ...claim, cost: 150000 }];
  assert.deepEqual(check(claims), [{ status: 'amount_mismatch', transactionAmount: 86000 }]);
  assert.equal(claims[0].cost, 150000);
  assert.equal(check([claim])[0].status, 'matched');
});
test('Warranty audit distinguishes free handling, missing links and missing receipts', () => {
  assert.equal(check([{ cost: 0 }])[0].status, 'no_cost');
  assert.equal(check([{ cost: 150000 }])[0].status, 'missing_link');
  assert.equal(check([claim], [])[0].status, 'missing_transaction');
});
test('Warranty audit rejects deleted, foreign, income and shared receipts', () => {
  assert.equal(check([claim], [{ ...tx, isDeleted: true }])[0].status, 'deleted_transaction');
  assert.equal(check([claim], [{ ...tx, saleId: 'other' }])[0].status, 'wrong_transaction');
  assert.equal(check([claim], [{ ...tx, type: 'income' }])[0].status, 'wrong_transaction');
  assert.deepEqual(check([claim, claim]).map(result => result.status), ['duplicate_link', 'duplicate_link']);
});
