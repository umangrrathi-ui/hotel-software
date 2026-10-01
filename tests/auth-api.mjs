// Staff login: owner setup key, login codes, sessions, and that identity never comes from request headers.
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const esbuildPath=readdirSync('node_modules/.pnpm').filter(n=>n.startsWith('esbuild@')).sort().at(-1);
const {build}=await import(resolve('node_modules/.pnpm',esbuildPath,'node_modules/esbuild/lib/main.js'));
const db=new DatabaseSync(':memory:');
for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync('drizzle/'+f,'utf8'));
class Statement{constructor(sql){this.sql=sql;this.args=[]}bind(...a){this.args=a;return this}first(){return db.prepare(this.sql).get(...this.args)||null}all(){return {results:db.prepare(this.sql).all(...this.args)}}run(){return {meta:{changes:Number(db.prepare(this.sql).run(...this.args).changes)}}}}
globalThis.testEnv={OWNER_SETUP_KEY:'test-setup-key-123',DB:{prepare:s=>new Statement(s),async batch(ops){db.exec('BEGIN');try{let result=ops.map(o=>o.run());db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}}}};
// One cookie jar per simulated browser.
let jar=new Map();globalThis.testCookies={get:k=>jar.has(k)&&jar.get(k)!==''?{value:jar.get(k)}:undefined,set:(k,v)=>jar.set(k,v)};
const browser=()=>{jar=new Map();};
const dir=mkdtempSync(join(tmpdir(),'hotel-auth-test-'));
const boundaries={name:'test-boundaries',setup(b){b.onResolve({filter:/^(cloudflare:workers|next\/headers)$/},a=>({path:a.path,namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path==='cloudflare:workers'?'export const env=globalThis.testEnv':'export async function cookies(){return globalThis.testCookies}',loader:'js'}))}};
for(const [src,out] of [['app/api/auth/route.ts','auth.mjs'],['app/api/desk/route.ts','desk.mjs']])await build({entryPoints:[src],outfile:join(dir,out),platform:'node',format:'esm',bundle:true,logLevel:'silent',alias:{'@':resolve('.')},plugins:[boundaries]});
const auth=await import(join(dir,'auth.mjs')),desk=await import(join(dir,'desk.mjs'));let n=0;
async function call(mod,url,body,status=200,headers={}){const r=await mod.POST(new Request('https://hotel.test'+url,{method:'POST',headers:{'content-type':'application/json',origin:'https://hotel.test',...headers},body:JSON.stringify(body)}));const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));n++;return d}
const A=(b,s,h)=>call(auth,'/api/auth',b,s,h),D=(b,s,h)=>call(desk,'/api/desk',b,s,h);
const me=async(headers={})=>(await (await desk.GET(new Request('https://hotel.test/api/desk',{headers}))).json()).user;
try{
// Forged hosting headers grant nothing.
assert.equal(await me({'oai-authenticated-user-id':'x','oai-authenticated-user-email':'owner@example.test'}),null);
await D({action:'createHotel',name:'Forged'},401,{'oai-authenticated-user-id':'x','oai-authenticated-user-email':'x@x.test'});
// Owner setup needs the server key.
await A({action:'register',setupKey:'wrong',name:'Owner',email:'owner@example.test',password:'owner-pass-1'},403);
await A({action:'register',setupKey:'test-setup-key-123',name:'Owner',email:'owner@example.test',password:'short'},400);
await A({action:'register',setupKey:'test-setup-key-123',name:'Owner',email:'Owner@Example.test',password:'owner-pass-1'});
assert.equal((await me()).email,'owner@example.test');
assert.match(db.prepare('SELECT pass FROM users').get().pass,/^pbkdf2\$100000\$/);
const hotel=(await D({action:'createHotel',name:'Hotel A'})).id;
// Adding staff returns a one-time code; the code is stored hashed.
const {code}=await D({action:'member',hotel,name:'Ravi',email:'ravi@example.test',role:'staff',department:'Housekeeping'});
assert.match(code,/^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/);
assert.notEqual(db.prepare("SELECT invite FROM members WHERE email='ravi@example.test'").get().invite,code);
await A({action:'logout'});assert.equal(await me(),null);
// Wrong password / wrong code / reused code.
await A({action:'login',email:'owner@example.test',password:'nope-nope'},401);
browser();await A({action:'activate',email:'ravi@example.test',code:'AAAAA-AAAAA',password:'ravi-pass-1'},401);
await A({action:'activate',email:'ravi@example.test',code:code.toLowerCase(),password:'ravi-pass-1'});
assert.equal((await me()).email,'ravi@example.test');
let state=await (await desk.GET(new Request('https://hotel.test/api/desk?hotel='+hotel))).json();assert.equal(state.member.role,'staff');
await D({action:'room',hotel,label:'101'},403);await D({action:'createHotel',name:'Staff side hotel'},403);
browser();await A({action:'activate',email:'ravi@example.test',code,password:'other-pass-1'},401);
await A({action:'login',email:'ravi@example.test',password:'ravi-pass-1'});
// Admin-issued new code resets a forgotten password and revokes old sessions.
const ravi=new Map(jar);browser();await A({action:'login',email:'owner@example.test',password:'owner-pass-1'});
const ravim=state.members.find(m=>m.email==='ravi@example.test');
const reset=await D({action:'invite',hotel,id:ravim.id});
browser();await A({action:'activate',email:'ravi@example.test',code:reset.code,password:'ravi-pass-2'});
jar=ravi;assert.equal(await me(),null);
browser();await A({action:'login',email:'ravi@example.test',password:'ravi-pass-2'});
// Another hotel's admin cannot take over a login used elsewhere.
browser();await A({action:'register',setupKey:'test-setup-key-123',name:'Other owner',email:'other@example.test',password:'other-pass-1'});
const hotelB=(await D({action:'createHotel',name:'Hotel B'})).id;
const steal=await D({action:'member',hotel:hotelB,name:'Owner?',email:'owner@example.test',role:'staff',department:'Reception'});
browser();await A({action:'activate',email:'owner@example.test',code:steal.code,password:'hijacked-1'},409);
await A({action:'login',email:'owner@example.test',password:'hijacked-1'},401);
await A({action:'login',email:'owner@example.test',password:'owner-pass-1'});
// Login attempts are rate limited per email.
browser();for(let i=0;i<8;i++)await A({action:'login',email:'ravi@example.test',password:'bad-pass-'+i},401);
await A({action:'login',email:'ravi@example.test',password:'ravi-pass-2'},429);
console.log(`PASS: ${n} auth assertions (setup key, login codes, password reset, session revocation, header forgery, cross-hotel takeover, rate limit).`);
}finally{db.close();rmSync(dir,{recursive:true,force:true})}
