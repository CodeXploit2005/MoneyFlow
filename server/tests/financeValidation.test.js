import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { login } from '../src/controllers/authController.js';
import { setBudget } from '../src/controllers/budgetController.js';
import { createTransaction } from '../src/controllers/transactionController.js';
import { extendWarranty, addWarrantyClaim } from '../src/controllers/warrantyController.js';
import { createDebt, recordDebtPayment } from '../src/controllers/debtController.js';
import Debt from '../src/models/Debt.js';
let db;
const res=()=>({code:200,status(n){this.code=n;return this;},json(body){this.body=body;return this;}});
test.before(async()=>{db=await MongoMemoryServer.create();await mongoose.connect(db.getUri());});
test.after(async()=>{await mongoose.disconnect();await db?.stop();});
test('Wrong login returns the requested Vietnamese message',async()=>{
 const response=res();await login({body:{email:'missing@example.com',password:'wrong-password'}},response);assert.equal(response.code,401);assert.equal(response.body.message,'Tài khoản hoặc mật khẩu không đúng. Xin vui lòng nhập lại.');
});
test('Budget, transaction and warranty reject invalid money before saving',async()=>{
 for(const amount of [-1,1.5,'invalid',Number.MAX_SAFE_INTEGER+1]){
  for(const [handler,body] of [[setBudget,{amount}],[createTransaction,{amount}],[extendWarranty,{additionalDays:30,price:amount}],[addWarrantyClaim,{issue:'Test',cost:amount}]]){
   const response=res();await handler({body,user:{_id:new mongoose.Types.ObjectId()},params:{id:new mongoose.Types.ObjectId()}},response);assert.equal(response.code,400);
  }
 }
 for(const month of [0,13,1.5]){const response=res();await setBudget({body:{amount:100000,month,year:2026}},response);assert.equal(response.code,400);}
});
test('Debt payments reduce balance correctly and cannot overpay',async()=>{
 const owner=new mongoose.Types.ObjectId();const request={user:{_id:owner},body:{type:'receivable',amount:150000,counterparty:'Test'}};const created=res();await createDebt(request,created);assert.equal(created.code,201);const debt=await Debt.findOne({ownerId:owner});
 const partial=res();await recordDebtPayment({user:request.user,params:{id:debt._id},body:{amount:50000}},partial);assert.equal(partial.code,200);assert.equal((await Debt.findById(debt._id)).remainingAmount,100000);
 const denied=res();await recordDebtPayment({user:request.user,params:{id:debt._id},body:{amount:100001}},denied);assert.equal(denied.code,400);
 const done=res();await recordDebtPayment({user:request.user,params:{id:debt._id},body:{amount:100000}},done);assert.equal(done.code,200);assert.equal((await Debt.findById(debt._id)).status,'paid');
});
