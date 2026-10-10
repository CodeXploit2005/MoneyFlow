import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanCustomerName, cleanCustomerPhone, customerContactFilter } from '../src/utils/customerIdentity.js';
test('Identity normalization preserves names and handles Vietnamese country codes', () => {
 assert.equal(cleanCustomerName('  Nguyễn   Đặng  '), 'Nguyễn Đặng');
 assert.equal(cleanCustomerName('  ACME   Co.  '), 'ACME Co.');
 for (const phone of ['+84 912 345 678','0084 912 345 678','84 912 345 678','0912.345.678']) assert.equal(cleanCustomerPhone(phone),'0912345678');
});
test('Legacy contacts match literally across formats', () => {
 const condition=customerContactFilter('0912345678','vip+crm@example.com');
 const phone=new RegExp(condition.$or[0].phone.$regex);
 for (const stored of ['0912345678','0912 345 678','+84 912.345.678','0084912345678']) assert.ok(phone.test(stored),stored);
 assert.ok(!phone.test('0987654321'));
 const email=new RegExp(condition.$or[1].email.$regex,'i');
 assert.ok(email.test('VIP+CRM@EXAMPLE.COM')); assert.ok(!email.test('vipcrm@example.com'));
 assert.ok(new RegExp(customerContactFilter('+12025550123','').$or[0].phone.$regex).test('+1 (202) 555-0123'));
 assert.equal(customerContactFilter('',''),null);
});
