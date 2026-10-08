import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, determineWarrantyStatus, getDaysRemaining } from '../src/utils/dateUtils.js';

test('Tính toán ngày hết hạn bảo hành', () => {
  const startDate = new Date('2026-01-01T00:00:00Z');
  const endDate = addDays(startDate, 30);
  assert.equal(endDate.getUTCDate(), 31);
  assert.equal(endDate.getUTCMonth(), 0); // Tháng 1
});

test('Xác định trạng thái bảo hành: Còn hạn (active)', () => {
  const now = new Date('2026-05-01T00:00:00Z');
  const end = new Date('2026-05-15T00:00:00Z'); // Còn 14 ngày
  const status = determineWarrantyStatus(end, now);
  assert.equal(status, 'active');
});

test('Xác định trạng thái bảo hành: Sắp hết hạn trong 3 ngày (expiring_soon)', () => {
  const now = new Date('2026-05-01T00:00:00Z');
  const end = new Date('2026-05-03T00:00:00Z'); // Còn 2 ngày
  const status = determineWarrantyStatus(end, now);
  assert.equal(status, 'expiring_soon');
});

test('Xác định trạng thái bảo hành: Đã hết hạn (expired)', () => {
  const now = new Date('2026-05-05T00:00:00Z');
  const end = new Date('2026-05-01T00:00:00Z'); // Quá 4 ngày
  const status = determineWarrantyStatus(end, now);
  assert.equal(status, 'expired');
});
