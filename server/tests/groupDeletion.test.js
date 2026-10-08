import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import Group from '../src/models/Group.js';
import GroupMember from '../src/models/GroupMember.js';
import Transaction from '../src/models/Transaction.js';
import Sale from '../src/models/Sale.js';
import Invite from '../src/models/Invite.js';
import { deleteGroup } from '../src/controllers/groupController.js';
import { updateTransaction } from '../src/controllers/transactionController.js';
let db;
const response=()=>({code:200,status(n){this.code=n;return this;},json(body){this.body=body;return this;}});
test.before(async()=>{db=await MongoMemoryReplSet.create({replSet:{count:1}});await mongoose.connect(db.getUri());});
test.after(async()=>{await mongoose.disconnect();await db.stop();});
test('Only owner can delete a group; deletion revokes membership and preserves business records',async()=>{
 const owner=new mongoose.Types.ObjectId(),other=new mongoose.Types.ObjectId();
 const group=await Group.create({name:'Deletion test',ownerId:owner});
 await GroupMember.create({groupId:group._id,userId:owner,role:'owner'});
 const tx=await Transaction.create({ownerId:owner,groupId:group._id,type:'income',amount:100,title:'Keep record',categoryId:new mongoose.Types.ObjectId()});
 const denied=response();await deleteGroup({params:{groupId:group._id},user:{_id:other}},denied);assert.equal(denied.code,400);assert.equal(await GroupMember.countDocuments({groupId:group._id}),1);
 const done=response();await deleteGroup({params:{groupId:group._id},user:{_id:owner}},done);assert.equal(done.code,200);assert.ok((await Group.findById(group._id)).deletedAt);assert.equal(await GroupMember.countDocuments({groupId:group._id}),0);assert.ok(await Transaction.findById(tx._id));assert.equal(await Invite.countDocuments({groupId:group._id}),0);
});
test('Correcting linked cost updates sale profit atomically and rejects invalid totals',async()=>{
 const owner=new mongoose.Types.ObjectId();
 const sale=await Sale.create({ownerId:owner,customerId:new mongoose.Types.ObjectId(),productName:'Correction',price:329000,cost:50000,quantity:1,profit:279000,warrantyEnd:new Date()});
 const tx=await Transaction.create({ownerId:owner,saleId:sale._id,type:'expense',amount:50000,title:'Cost',categoryId:new mongoose.Types.ObjectId()});
 sale.costTransactionId=tx._id;await sale.save();
 const done=response();await updateTransaction({params:{id:tx._id},user:{_id:owner},body:{amount:150000}},done);assert.equal(done.code,200);
 const saved=await Sale.findById(sale._id);assert.equal(saved.cost,150000);assert.equal(saved.profit,179000);assert.equal((await Transaction.findById(tx._id)).amount,150000);
 const denied=response();await updateTransaction({params:{id:tx._id},user:{_id:new mongoose.Types.ObjectId()},body:{amount:50000}},denied);assert.equal(denied.code,403);
 saved.quantity=3;await saved.save();const invalid=response();await updateTransaction({params:{id:tx._id},user:{_id:owner},body:{amount:150001}},invalid);assert.equal(invalid.code,400);assert.equal((await Transaction.findById(tx._id)).amount,150000);assert.equal((await Sale.findById(sale._id)).cost,150000);
});
test('Correcting a receipt recalculates paid amount and payment status; overpayment leaves both unchanged',async()=>{
 const owner=new mongoose.Types.ObjectId();const sale=await Sale.create({ownerId:owner,customerId:new mongoose.Types.ObjectId(),productName:'Receipt',price:200000,paidAmount:200000,paymentStatus:'paid',warrantyEnd:new Date()});
 const tx=await Transaction.create({ownerId:owner,saleId:sale._id,type:'income',amount:200000,title:'Receipt',categoryId:new mongoose.Types.ObjectId()});sale.incomeTransactionId=tx._id;await sale.save();
 const done=response();await updateTransaction({params:{id:tx._id},user:{_id:owner},body:{amount:150000}},done);assert.equal(done.code,200);const saved=await Sale.findById(sale._id);assert.equal(saved.paidAmount,150000);assert.equal(saved.paymentStatus,'partial');
 const denied=response();await updateTransaction({params:{id:tx._id},user:{_id:owner},body:{amount:250000}},denied);assert.equal(denied.code,400);assert.equal((await Transaction.findById(tx._id)).amount,150000);assert.equal((await Sale.findById(sale._id)).paidAmount,150000);
});
test('Sale-linked transaction accepts metadata updates but rejects financial changes',async()=>{
 const owner=new mongoose.Types.ObjectId(); const tx=await Transaction.create({ownerId:owner,saleId:new mongoose.Types.ObjectId(),type:'expense',amount:50000,title:'Cost',categoryId:new mongoose.Types.ObjectId()});
 const denied=response();await updateTransaction({params:{id:tx._id},user:{_id:owner},body:{amount:150000}},denied);assert.equal(denied.code,400);assert.equal((await Transaction.findById(tx._id)).amount,50000);
 const done=response();await updateTransaction({params:{id:tx._id},user:{_id:owner},body:{note:'Updated note'},app:{get:()=>null}},done);assert.equal(done.code,200);assert.equal((await Transaction.findById(tx._id)).note,'Updated note');
 const full=response();await updateTransaction({params:{id:tx._id},user:{_id:owner},body:{title:'Updated cost',note:'Full form',type:tx.type,amount:String(tx.amount),categoryId:String(tx.categoryId),date:tx.date.toISOString()}},full);assert.equal(full.code,200);const saved=await Transaction.findById(tx._id);assert.equal(saved.title,'Updated cost');assert.equal(saved.amount,50000);assert.equal(saved.date.getTime(),tx.date.getTime());
 for(const change of [{type:'income'},{categoryId:String(new mongoose.Types.ObjectId())},{date:'2020-01-01'},{amount:'invalid'}]){const blocked=response();await updateTransaction({params:{id:tx._id},user:{_id:owner},body:change},blocked);assert.equal(blocked.code,400);}
});
