import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { build } from '../node_modules/esbuild/lib/main.js';
const require=createRequire(new URL('../package.json',import.meta.url));
const axios=require('axios');
const memory=new Map();
globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};
globalThis.window={location:{origin:'http://localhost',pathname:'/sales'}};
const result=await build({stdin:{contents:"export { waitForBackend } from './src/api/readiness'; export { default as api } from './src/api/axios'; export { useAuthStore } from './src/store/authStore';",resolveDir:new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')},bundle:true,write:false,platform:'node',format:'cjs',external:['axios','zustand','react'],define:{'import.meta.env':JSON.stringify({DEV:true})}});
const compiled=new Module(new URL('./auth-fixture.cjs',import.meta.url).pathname);compiled.filename=require.resolve('../package.json');compiled.paths=require.resolve.paths('axios');compiled._compile(result.outputFiles[0].text,compiled.filename);
const {api,useAuthStore,waitForBackend}=compiled.exports;
const jwt=seconds=>'header.'+Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+seconds})).toString('base64url')+'.signature';
const response=(config,data)=>({config,data,status:200,statusText:'OK',headers:{}});
const failure=(config,status)=>Promise.reject(new axios.AxiosError('Request failed',undefined,config,undefined,{config,status,data:{message:'Unauthorized'},headers:{},statusText:'Error'}));
const login=token=>{memory.clear();useAuthStore.getState().setAuth({_id:'user',name:'Tester'},token);};
test('Expired tokens refresh once before concurrent API calls',async()=>{
 login(jwt(-10));const fresh=jwt(600);let refreshes=0,requests=0;
 axios.defaults.adapter=async config=>{refreshes++;await new Promise(resolve=>setTimeout(resolve,5));return response(config,{data:{accessToken:fresh}});};
 api.defaults.adapter=async config=>{requests++;assert.equal(config.headers.Authorization,'Bearer '+fresh);return response(config,{ok:true});};
 await Promise.all(Array.from({length:10},()=>api.get('/sales')));assert.equal(refreshes,1);assert.equal(requests,10);
});
test('Concurrent 401 requests retry only once and share refresh',async()=>{
 const old=jwt(600);login(old);const fresh=jwt(900);let refreshes=0;
 axios.defaults.adapter=async config=>{refreshes++;await new Promise(resolve=>setTimeout(resolve,5));return response(config,{data:{accessToken:fresh}});};
 api.defaults.adapter=config=>config.headers.Authorization==='Bearer '+old?failure(config,401):Promise.resolve(response(config,{ok:true}));
 await Promise.all(Array.from({length:5},()=>api.get('/customers')));assert.equal(refreshes,1);
});
test('Network refresh failure preserves login',async()=>{
 const old=jwt(-10);login(old);
 axios.defaults.adapter=config=>Promise.reject(new axios.AxiosError('Network unavailable','ERR_NETWORK',config));
 await assert.rejects(api.get('/sales'),/Không kết nối được máy chủ/);assert.equal(memory.get('moneyflow_token'),old);assert.equal(useAuthStore.getState().isAuthenticated,true);
});
test('Revoked refresh expires the session',async()=>{
 login(jwt(-10));axios.defaults.adapter=config=>failure(config,401);
 await assert.rejects(api.get('/sales'));assert.equal(useAuthStore.getState().isAuthenticated,false);
});
test('Wrong login credentials do not trigger token refresh or clear existing login',async()=>{
 const old=jwt(600);login(old);let refreshes=0;
 axios.defaults.adapter=async config=>{refreshes++;return response(config,{});};api.defaults.adapter=config=>failure(config,401);
 await assert.rejects(api.post('/auth/login',{}),/Unauthorized/);assert.equal(refreshes,0);assert.equal(memory.get('moneyflow_token'),old);
});
test('A second unauthorized response terminates retry without a refresh loop',async()=>{
 login(jwt(600));let refreshes=0,requests=0;
 axios.defaults.adapter=async config=>{refreshes++;return response(config,{data:{accessToken:jwt(900)}});};
 api.defaults.adapter=config=>{requests++;return failure(config,401);};
 await assert.rejects(api.get('/sales'),/hết hạn/);assert.equal(refreshes,1);assert.equal(requests,2);assert.equal(useAuthStore.getState().isAuthenticated,false);
});

test('Readiness wakes with GET only and checks database before login',async()=>{
 let calls=0;
 axios.defaults.adapter=async config=>{
  calls++;assert.equal(config.method,'get');assert.equal(config.url,'/api/health');
  assert.equal(config.withCredentials,false);
  return response(config,{app:'MoneyFlow API',status:calls===1?'unavailable':'healthy'});
 };
 await waitForBackend();assert.equal(calls,2);
});

test('Readiness does not retry rate limited requests',async()=>{
 let calls=0;axios.defaults.adapter=config=>{calls++;return failure(config,429);};
 await assert.rejects(waitForBackend(),/Quá nhiều yêu cầu/);assert.equal(calls,1);
});
