import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { io as connect } from '../../client/node_modules/socket.io-client/build/esm/index.js';
import { initSocket } from '../src/sockets/socketHandler.js';
import User from '../src/models/User.js';
import { generateAccessToken } from '../src/utils/jwt.js';
let db, server, io, origin, token;
test.before(async()=>{
 db=await MongoMemoryServer.create();await mongoose.connect(db.getUri());
 const user=await User.create({name:'Socket test',email:'socket@test.local',password:'secret123'});
 token=generateAccessToken({userId:String(user._id)});
 server=http.createServer();io=initSocket(server,['http://localhost:5173']);
 server.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));origin='http://127.0.0.1:'+server.address().port;
});
test.after(async()=>{await new Promise(resolve=>io.close(resolve));await mongoose.disconnect();await db?.stop();});
const waitConnected=socket=>new Promise((resolve,reject)=>{
 const timer=setTimeout(()=>{socket.disconnect();reject(new Error('Socket timeout'));},5000);
 socket.once('connect',()=>{clearTimeout(timer);resolve();});socket.once('connect_error',error=>{clearTimeout(timer);socket.disconnect();reject(error);});
});
test('Engine.IO polling handshake returns 200',async()=>{
 const response=await fetch(origin+'/socket.io/?EIO=4&transport=polling');assert.equal(response.status,200);assert.ok((await response.text()).startsWith('0{"sid":'));
});
test('Both websocket and polling authenticate successfully',async()=>{
 for(const transport of ['websocket','polling']){
  const socket=connect(origin,{auth:{token},transports:[transport],reconnection:false});
  try{await waitConnected(socket);assert.equal(socket.io.engine.transport.name,transport);}finally{socket.disconnect();}
 }
});
test('Websocket-first client falls back to polling when websocket is unavailable',async()=>{
 const original=io.engine.opts.transports;io.engine.opts.transports=['polling'];
 const socket=connect(origin,{auth:{token},transports:['websocket','polling'],tryAllTransports:true,reconnection:false});
 try{await waitConnected(socket);assert.equal(socket.io.engine.transport.name,'polling');}finally{socket.disconnect();io.engine.opts.transports=original;}
});
test('Invalid authentication is reported as connect_error instead of an HTTP 500',async()=>{
 const socket=connect(origin,{auth:{token:'invalid'},transports:['websocket'],reconnection:false});
 await assert.rejects(waitConnected(socket),/Authentication error/);
});
