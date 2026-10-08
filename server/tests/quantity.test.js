import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Sale from '../src/models/Sale.js';

test('Sale rejects fractional, zero, negative and unsafe quantities before saving', () => {
  const data = { productName: 'Quantity validation', price: 100, customerId: new mongoose.Types.ObjectId(), ownerId: new mongoose.Types.ObjectId(), warrantyEnd: new Date() };
  for (const quantity of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.ok(new Sale({ ...data, quantity }).validateSync()?.errors.quantity);
  }
  assert.equal(new Sale({ ...data, quantity: 2 }).validateSync(), undefined);
});
