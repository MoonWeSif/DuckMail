const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
function load(file, extra = {}) {
 const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const context={exports:{},require,Headers,Response,URL,process:{env:{}},...extra};
 vm.runInNewContext(code,context);
 return context.exports;
}
function setup(responses) {
 let now=1700000000000,calls=0;
 const values=new Map();
 const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const overrides={window:{},localStorage:storage,Date:class extends Date{static now(){return now}},fetch:async()=>{calls++;return responses.shift()||new Response('{}')}};
 const api=load('lib/rate-limited-fetch.ts',overrides);
 return {api,overrides,values,calls:()=>calls,advance:ms=>{now+=ms}};
}
test('429 cooldown covers mailbox switching, login and new tabs, without network retries', async()=>{
 const s=setup([new Response(JSON.stringify({message:'Too many abnormal requests from this IP.'}),{status:429,headers:{'Retry-After':'600'}})]);
 await assert.rejects(s.api.rateLimitedFetch('/api/mail?endpoint=/me'),e=>e.status===429 && /600 seconds/.test(e.message));
 await assert.rejects(s.api.rateLimitedFetch('/api/mail?endpoint=/token',{method:'POST'}),e=>e.status===429);
 const otherTab=load('lib/rate-limited-fetch.ts',s.overrides);
 await assert.rejects(otherTab.rateLimitedFetch('/api/mail?endpoint=/messages'),e=>e.status===429);
 assert.equal(s.calls(),1);
 s.advance(600001);
 assert.equal((await otherTab.rateLimitedFetch('/api/mail?endpoint=/me')).status,200);
 assert.equal(s.calls(),2);
 assert.equal(s.values.size,0);
});
test('other providers are independent and HTTP-date Retry-After is respected',async()=>{
 const date=new Date(1700000000000+10000).toUTCString();
 const s=setup([new Response('{}',{status:429,headers:{'Retry-After':date}})]);
 await assert.rejects(s.api.rateLimitedFetch('/api/mail'),e=>/10 seconds/.test(e.message));
 assert.equal((await s.api.rateLimitedFetch('/api/mail',{headers:{'X-API-Provider-Base-URL':'https://api.mail.tm'}})).status,200);
 s.advance(10001);assert.equal((await s.api.rateLimitedFetch('/api/mail')).status,200);
});
test('invalid Retry-After uses short fallback; abort and other statuses do not set cooldown',async()=>{
 const s=setup([new Response('{}',{status:429,headers:{'Retry-After':'nonsense'}}),new Response('{}',{status:401}),new Response('{}',{status:500})]);
 await assert.rejects(s.api.rateLimitedFetch('/api/mail'),e=>/5 seconds/.test(e.message));
 s.advance(5001);
 assert.equal((await s.api.rateLimitedFetch('/api/mail')).status,401);
 assert.equal((await s.api.rateLimitedFetch('/api/mail')).status,500);
 const ctrl=new AbortController();ctrl.abort();
 await assert.rejects(s.api.rateLimitedFetch('/api/mail',{signal:ctrl.signal}),e=>e.name==='AbortError');
 assert.equal(s.calls(),3);
});
test('proxy forwarding is opt-in, uses canonical real IP and never trusts browser XFF',()=>{
 const incoming=new Headers({'X-Real-IP':'198.51.100.7','X-Forwarded-For':'1.2.3.4'});
 const base=new URL('https://api.duckmail.sbs');
 let headers=new Headers();
 load('lib/proxy-client-ip.ts').forwardClientIP(incoming,headers,base,base);
 assert.equal(headers.get('X-Forwarded-For'),null);
 const api=load('lib/proxy-client-ip.ts',{process:{env:{DUCKMAIL_TRUST_PROXY_HEADERS:'true'}}});
 api.forwardClientIP(incoming,headers,base,base);
 assert.equal(headers.get('X-Forwarded-For'),'198.51.100.7');
 headers=new Headers();api.forwardClientIP(incoming,headers,new URL('https://api.mail.tm'),base);
 assert.equal(headers.get('X-Forwarded-For'),null);
 headers=new Headers();api.forwardClientIP(new Headers({'X-Real-IP':'bad-ip','X-Forwarded-For':'1.2.3.4'}),headers,base,base);
 assert.equal(headers.get('X-Forwarded-For'),null);
});

test('Web route adds only its server secret, never forwards a browser secret to another provider',async()=>{
 const secret='s'.repeat(64);
 for(const configured of [false,true]) {
  const calls=[];
  const route=load('app/api/mail/route.ts',{
   Buffer,AbortSignal,
   process:{env:configured?{DUCKMAIL_WEB_PROXY_SECRET:secret}:{}},
   require:name=>{
    if(name==='next/server')return {NextResponse:{json:Response.json.bind(Response)}};
    if(name==='@/lib/proxy-client-ip')return load('lib/proxy-client-ip.ts');
    if(name==='@/lib/browser-request')return load('lib/browser-request.ts');
    throw Error(name);
   },
   fetch:async(url,init)=>{calls.push({url,headers:init.headers});return new Response('{}',{headers:{'Content-Type':'application/json','X-DuckMail-Web-Secret':'must-not-leak'}})},
  });
  for(const provider of ['https://api.duckmail.sbs','https://api.mail.tm']) {
   const result=await route.GET({
    nextUrl:new URL('http://localhost/api/mail?endpoint=%2Fdomains'),method:'GET',
    headers:new Headers({'Sec-Fetch-Site':'same-origin','Sec-Fetch-Mode':'cors','Sec-Fetch-Dest':'empty','X-API-Provider-Base-URL':provider,'X-DuckMail-Web-Secret':'browser-forgery'}),
   });
   assert.equal(result.status,200);
   assert.equal(result.headers.get('X-DuckMail-Web-Secret'),null);
   assert.equal(calls.at(-1).headers.get('X-DuckMail-Web-Secret'),configured && provider==='https://api.duckmail.sbs'?secret:null);
  }
 }
});


test('Web API accepts same-origin fetches and rejects direct scripts, navigations and cross-site requests before forwarding',async()=>{
 const guard=load('lib/browser-request.ts');
 const browser={'Sec-Fetch-Site':'same-origin','Sec-Fetch-Mode':'cors','Sec-Fetch-Dest':'empty'};
 for(const headers of [browser,{...browser,Origin:'https://duckmail.sbs',Host:'duckmail.sbs'},{...browser,'Sec-Fetch-Mode':'same-origin'}]) {
  assert.equal(guard.rejectNonBrowserRequest({headers:new Headers(headers),nextUrl:new URL('https://duckmail.sbs/api/mail')}),null);
 }
 for(const headers of [{},{'User-Agent':'Mozilla/5.0'}, {...browser,'Sec-Fetch-Site':'cross-site'}, {...browser,'Sec-Fetch-Site':'same-site'}, {...browser,'Sec-Fetch-Mode':'navigate'}, {...browser,'Sec-Fetch-Dest':'document'}, {...browser,Origin:'https://evil.example',Host:'duckmail.sbs'}, {...browser,Origin:'null'}]) {
  const result=guard.rejectNonBrowserRequest({headers:new Headers(headers),nextUrl:new URL('https://duckmail.sbs/api/mail')});
  assert.equal(result.status,403);assert.equal(result.headers.get('Cache-Control'),'no-store');
 }
 for(const file of ['app/api/mail/route.ts','app/api/sse/route.ts']) {
  const route=load(file,{
   Buffer,AbortSignal,
   require:name=>{
    if(name==='next/server')return {NextResponse:{json:Response.json.bind(Response)}};
    if(name==='@/lib/proxy-client-ip')return load('lib/proxy-client-ip.ts');
    if(name==='@/lib/browser-request')return guard;
    throw Error(name);
   },
   fetch:async()=>assert.fail('rejected request reached backend'),
  });
  const response=await route.GET({headers:new Headers(),nextUrl:new URL('http://localhost/api/mail?endpoint=%2Fdomains'),method:'GET'});
  assert.equal(response.status,403);
 }
});
