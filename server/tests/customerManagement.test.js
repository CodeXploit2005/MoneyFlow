import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Customer from '../src/models/Customer.js';
import Sale from '../src/models/Sale.js';
import Transaction from '../src/models/Transaction.js';
import { generateAccessToken } from '../src/utils/jwt.js';
let db, server, origin, owner, outsider, customer;
async function request(path, method = 'GET', body, user = owner) {
 const response = await fetch(origin + '/api' + path, {method, headers: {Authorization: 'Bearer ' + generateAccessToken({userId: String(user._id)}), 'Content-Type': 'application/json'}, ...(body ? {body: JSON.stringify(body)} : {})});
 return {status: response.status, ...(await response.json())};
}
test.before(async () => {
 db = await MongoMemoryServer.create(); await mongoose.connect(db.getUri());
 [owner, outsider] = await User.create(['crm-owner','crm-outsider'].map(name => ({name,email:name+'@test.local',password:'secret123'})));
 await Customer.create(Array.from({length:65},(_,i) => ({name:'Khách '+String(i).padStart(3,'0'),ownerId:owner._id})));
 server = app.listen(0,'127.0.0.1'); await new Promise(resolve=>server.once('listening',resolve)); origin='http://127.0.0.1:'+server.address().port;
});
test.after(async()=>{if(server) await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();await db?.stop();});
test('Pagination reaches every customer and validates limits',async()=>{
 const first=await request('/customers?limit=25&page=1&sort=name_asc'); const third=await request('/customers?limit=25&page=3&sort=name_asc');
 assert.equal(first.data.pagination.total,65); assert.equal(first.data.customers.length,25); assert.equal(third.data.customers.length,15); assert.equal(third.data.customers[14].name,'Khách 064');
 for(const query of ['page=0','page=1.2','limit=101','limit=0','sort=bad']) assert.equal((await request('/customers?'+query)).status,400);
});
test('Customer creation normalizes names and contacts; duplicate contacts are blocked',async()=>{
 const result=await request('/customers','POST',{name:'  Nguyễn   Đặng  ',phone:'+84 912 345 678',email:'VIP@EXAMPLE.COM'}); assert.equal(result.status,201);
 customer=result.data; assert.equal(customer.name,'Nguyễn Đặng'); assert.equal(customer.phone,'0912345678'); assert.equal(customer.email,'vip@example.com');
 assert.equal((await request('/customers','POST',{name:'Other',phone:'0912.345.678'})).status,409);
 assert.equal((await request('/customers','POST',{name:'Other',email:'VIP@example.com'})).status,409);
 assert.equal((await request('/customers','POST',{name:'Nguyễn Đặng',phone:'0987654321'})).status,201);
 assert.equal((await request('/customers','POST',{name:'   '})).status,400);
 assert.equal((await request('/customers','POST',{name:'Test',phone:'invalid'})).status,400);
 assert.equal((await request('/customers','POST',{name:'Test',email:'invalid'})).status,400);
 const found=await request('/customers?keyword='+encodeURIComponent('nguyen dang')); assert.equal(found.data.pagination.total,2);
 assert.equal((await request('/customers?keyword=nguyen','GET',null,outsider)).data.customers.length,0);
});
test('Updating checks duplicates without moving a customer into another workspace',async()=>{
 const other=await Customer.findOne({phone:'0987654321'});
 assert.equal((await request('/customers/'+other._id,'PUT',{phone:'0912345678'})).status,409);
 assert.equal((await request('/customers/'+customer._id,'PUT',{name:' Nguyễn  Đặng ',phone:'0912 345 678',groupId:new mongoose.Types.ObjectId()})).status,200);
 assert.equal((await Customer.findById(customer._id)).groupId,null);
});
test('Sales search resolves customer names and protects linked profiles from deletion',async()=>{
 const sale=await Sale.create({ownerId:owner._id,customerId:customer._id,productName:'Office [365]',price:100,cost:20,profit:80,warrantyEnd:new Date(Date.now()+86400000)});
 const found=await request('/sales?keyword=nguyen%20dang'); assert.equal(found.data.sales[0]._id,String(sale._id));
 assert.equal((await request('/sales?keyword=%5B')).data.sales.length,1);
 assert.equal((await request('/sales?keyword=.*')).data.sales.length,0);
 assert.equal((await request('/customers/'+customer._id,'DELETE')).status,409);
 assert.equal((await request('/sales','POST',{newCustomer:{name:'Duplicate',phone:'+84912345678'},productName:'Test',price:100})).status,409);
});
test('Listing is read-only; same-name customers do not inherit ambiguous ledger entries',async()=>{
 await Transaction.collection.insertOne({ownerId:owner._id,groupId:null,type:'income',title:'Legacy payment',counterparty:'Nguyễn Đặng',amount:100,isDeleted:false});
 const before=await Customer.countDocuments(); await request('/customers?keyword=unknown'); assert.equal(await Customer.countDocuments(),before);
 const detail=await request('/customers/'+customer._id); assert.equal(detail.data.transactions.length,0);
});

test('Sales and transactions paginate filtered records consistently when timestamps tie', async()=>{
 const stamp=new Date('2026-01-01T00:00:00Z');
 await Sale.create(Array.from({length:45},(_,i)=>({ownerId:owner._id,customerId:customer._id,productName:'Pagination item '+i,price:100,cost:20,profit:80,warrantyEnd:stamp,soldAt:stamp,createdAt:stamp,paymentStatus:i%2?'unpaid':'paid'})));
 await Transaction.collection.insertMany(Array.from({length:45},(_,i)=>({ownerId:owner._id,groupId:null,title:'Pagination entry '+i,type:i%2?'expense':'income',amount:100,isDeleted:false,date:stamp,createdAt:stamp})));
 for(const [path,key,word] of [['sales','sales','Pagination item'],['transactions','transactions','Pagination entry'],['warranties','warranties','Pagination item']]) {
  const root='/'+path+'?keyword='+encodeURIComponent(word);
  const results=await Promise.all([1,2,3].map(page=>request(root+'&limit=20&page='+page)));
  assert.deepEqual(results.map(r=>r.data[key].length),[20,20,5]);
  assert.ok(results.every(r=>r.data.pagination.total===45));
  assert.equal(new Set(results.flatMap(r=>r.data[key].map(item=>item._id))).size,45);
  assert.deepEqual((await request(root+'&limit=50')).data[key].map(item=>item._id),results.flatMap(r=>r.data[key].map(item=>item._id)));
  assert.equal((await request(root+'&limit=100')).data[key].length,45);
  for(const invalid of ['page=0','page=-1','page=1.5','limit=0','limit=101']) assert.equal((await request(root+'&'+invalid)).status,400);
 }
 const paid=await request('/sales?keyword=Pagination&paymentStatus=paid&limit=20'); assert.equal(paid.data.pagination.total,23);assert.ok(paid.data.sales.every(item=>item.paymentStatus==='paid'));
 const income=await request('/transactions?keyword=Pagination&type=income&limit=20');assert.equal(income.data.pagination.total,23);assert.ok(income.data.transactions.every(item=>item.type==='income'));
});

test('Warranty calendar remains complete and customer search happens before pagination', async()=>{
 const calendar=await request('/warranties?keyword=Pagination'); assert.ok(Array.isArray(calendar.data)); assert.equal(calendar.data.length,45);
 const list=await request('/warranties?keyword=nguyen%20dang&limit=20&page=3'); assert.equal(list.status,200); assert.equal(list.data.pagination.total,46); assert.equal(list.data.warranties.length,6);
 assert.equal((await request('/warranties?keyword=nguyen','GET',null,outsider)).data.length,0);
});
