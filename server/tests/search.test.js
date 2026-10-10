import test from 'node:test';
import assert from 'node:assert/strict';
import { searchPattern } from '../src/utils/search.js';
const matches = (keyword, value) => new RegExp(searchPattern(keyword), 'i').test(value);
test('Names match with or without Vietnamese accents and with extra whitespace', () => {
 for (const keyword of ['nguyen dang', ' NGUYỄN   ĐẶNG ', 'Nguyễn Đặng']) assert.ok(matches(keyword, 'Nguyễn Đặng (VIP)'));
 assert.ok(matches('đặng', 'Dang'));
 assert.ok(!matches('tran', 'Nguyễn Đặng'));
});
test('Search punctuation is literal, including incomplete brackets', () => {
 for (const keyword of ['(', '[', '+', '.', '*', '?', '\\', '$', '^', '{', '|']) {
  assert.ok(matches(keyword, 'prefix' + keyword + 'suffix'));
  assert.ok(!matches(keyword, 'unrelated'));
 }
 assert.ok(!matches('.*', 'anything'));
});
test('Blank and non-string keywords do not create filters', () => {
 for (const value of ['', '   ', undefined, ['abc'], {}]) assert.equal(searchPattern(value), '');
});
