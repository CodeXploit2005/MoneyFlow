import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import User from '../src/models/User.js';
import PasswordReset from '../src/models/PasswordReset.js';
import { forgotPassword, verifyPasswordOtp, resetPassword } from '../src/controllers/passwordResetController.js';
import { authenticate } from '../src/middlewares/auth.js';
import { generateAccessToken } from '../src/utils/jwt.js';
let db, user, code;
const originalFetch = global.fetch;
const originalEnv = {};
const keys = ['EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY'];
const res = () => ({ code: 200, status(value) { this.code=value; return this; }, json(value) { this.body=value; return this; }, clearCookie() {} });
test.before(async () => {
  db = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(db.getUri()); await PasswordReset.init();
  for (const key of keys) { originalEnv[key] = process.env[key]; process.env[key]='test-only'; }
  global.fetch = async (url, options) => { assert.equal(url, 'https://api.emailjs.com/api/v1.0/email/send'); const params=JSON.parse(options.body).template_params; code=params.passcode; assert.equal(params.email, 'otp@example.com'); assert.equal(params.passcode, params.otp_code); assert.equal(params.expires_minutes, '15'); assert.match(params.time, /^\d{2}:\d{2}$/); return { ok:true }; };
});
test.after(async () => { global.fetch=originalFetch; for(const key of keys) { if(originalEnv[key]===undefined) delete process.env[key]; else process.env[key]=originalEnv[key]; } await mongoose.disconnect(); await db.stop(); });
test.beforeEach(async () => { await PasswordReset.deleteMany({}); await User.deleteMany({}); user=await User.create({ name:'OTP test', email:'otp@example.com', password:'original-password' }); });
const send = async () => { const response=res(); await forgotPassword({ body:{email:user.email} }, response); assert.equal(response.code,200); return response; };
test('Unknown account returns not found and never calls email service', async () => {
  const savedFetch=global.fetch;let sent=false;global.fetch=async()=>{sent=true;throw new Error('Must not send');};
  try {const response=res();await forgotPassword({body:{email:'unknown@example.com'}},response);assert.equal(response.code,404);assert.match(response.body.message,/Tài khoản không tồn tại/);assert.equal(sent,false);assert.equal(await PasswordReset.countDocuments(),0);}finally{global.fetch=savedFetch;}
});
test('Failed email removes pending OTP, reports configuration error and allows retry', async () => {
  const savedFetch=global.fetch;global.fetch=async()=>({ok:false,status:403,text:async()=> 'The Private Key is invalid'});
  try {const failed=res();await forgotPassword({body:{email:user.email}},failed);assert.equal(failed.code,503);assert.match(failed.body.message,/Private Key/);assert.equal(await PasswordReset.countDocuments(),0);}finally{global.fetch=savedFetch;}
  await send();
});
test('OTP is not returned or stored in plaintext, and resend is throttled', async () => {
  const response=await send(); const firstCode=code; const record=await PasswordReset.findOne({userId:user._id});
  assert.notEqual(record.hash,code); assert.ok(!JSON.stringify(response.body).includes(code));
  const throttled=res(); await forgotPassword({body:{email:user.email}},throttled); assert.equal(throttled.code,429); assert.equal(code,firstCode);
});
test('Correct OTP resets the password once and increments authentication version', async () => {
  await send(); const verified=res(); await verifyPasswordOtp({body:{email:user.email,code}},verified); assert.equal(verified.code,200); const response=res(); const body={email:user.email,resetToken:verified.body.data.resetToken,password:'replacement-password'};
  await resetPassword({body},response); assert.equal(response.code,200);
  const updated=await User.findById(user._id).select('+password'); assert.ok(await updated.comparePassword(body.password)); assert.equal(updated.authVersion,1);
  const stale=res(); await authenticate({headers:{authorization:`Bearer ${generateAccessToken({userId:user._id,authVersion:0})}`}},stale,()=>assert.fail('Old token accepted')); assert.equal(stale.code,401);
  const reused=res(); await resetPassword({body},reused); assert.equal(reused.code,400);
});
test('Five wrong attempts block even the correct code', async () => {
  await send(); const actual=code;
  for(let i=0;i<5;i++){const response=res();await verifyPasswordOtp({body:{email:user.email,code:'000000'}},response);assert.equal(response.code,400);}
  const response=res();await verifyPasswordOtp({body:{email:user.email,code:actual}},response);assert.equal(response.code,400);
});
test('Expired OTP cannot reset a password', async () => {
  await send(); await PasswordReset.updateOne({userId:user._id},{$set:{expiresAt:new Date(0)}});
  const response=res();await verifyPasswordOtp({body:{email:user.email,code}},response);assert.equal(response.code,400);
});
test('Password cannot change before OTP verification, and verified token is hashed and expires', async () => {
  await send();const denied=res();await resetPassword({body:{email:user.email,code,password:'replacement-password'}},denied);assert.equal(denied.code,400);
  const verified=res();await verifyPasswordOtp({body:{email:user.email,code}},verified);assert.equal(verified.code,200);const resetToken=verified.body.data.resetToken;
  const record=await PasswordReset.findOne({userId:user._id});assert.notEqual(record.resetTokenHash,resetToken);
  const again=res();await verifyPasswordOtp({body:{email:user.email,code}},again);assert.equal(again.code,400);
  const wrong=res();await resetPassword({body:{email:user.email,resetToken:'a'.repeat(64),password:'replacement-password'}},wrong);assert.equal(wrong.code,400);
  await PasswordReset.updateOne({userId:user._id},{$set:{expiresAt:new Date(0)}});const expired=res();await resetPassword({body:{email:user.email,resetToken,password:'replacement-password'}},expired);assert.equal(expired.code,400);
  const unchanged=await User.findById(user._id).select('+password');assert.ok(await unchanged.comparePassword('original-password'));
});
test('Missing EmailJS configuration returns an explicit unavailable error', async () => {
  delete process.env.EMAILJS_PRIVATE_KEY; const response=res();await forgotPassword({body:{email:user.email}},response);assert.equal(response.code,503);process.env.EMAILJS_PRIVATE_KEY='test-only';
});
