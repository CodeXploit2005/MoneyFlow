import test from 'node:test';
import assert from 'node:assert/strict';
import { ProfitService } from '../src/services/profitService.js';
import { VietQRService } from '../src/services/vietqrService.js';

test('Tính lãi bán hàng = (giá bán - giá vốn) * số lượng', () => {
  // Ví dụ: Bán Gemini giá 150.000đ, vốn 50.000đ, số lượng 2
  const profit = ProfitService.calculateProfit(150000, 50000, 2);
  assert.equal(profit, 200000);
});

test('Tính tỷ lệ biên lợi nhuận (Profit Margin %)', () => {
  // Bán 200k, vốn 100k -> margin = 50%
  const margin = ProfitService.calculateMargin(200000, 100000);
  assert.equal(margin, 50);
});

test('Sinh URL VietQR hợp lệ', () => {
  const qrUrl = VietQRService.generateQRUrl({
    bankCode: 'MB',
    accountNumber: '0988888888',
    accountName: 'NGUYEN VAN MINH',
    amount: 150000,
    description: 'MF-DH1234'
  });

  assert.ok(qrUrl.includes('img.vietqr.io'));
  assert.ok(qrUrl.includes('970422-0988888888-compact2.png'));
  assert.ok(qrUrl.includes('amount=150000'));
});
