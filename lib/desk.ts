import { env } from 'cloudflare:workers';
export const database=()=>{if(!env.DB)throw new Error('Database unavailable');return env.DB;};
export const one=async(sql:string,...a:any[])=>database().prepare(sql).bind(...a).first<any>();
export const all=async(sql:string,...a:any[])=>(await database().prepare(sql).bind(...a).all<any>()).results;
export const run=(sql:string,...a:any[])=>database().prepare(sql).bind(...a).run();
export const id=()=>crypto.randomUUID();
export const now=()=>Date.now();
export const hash=async(v:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(x=>x.toString(16).padStart(2,'0')).join('');
export const parse=(v:any)=>{try{return JSON.parse(v||'{}')}catch{return {}}};
export const clean=(v:any,n=500)=>String(v??'').trim().slice(0,n);
export function fail(s:string,status=400):never{throw Object.assign(new Error(s),{status});}
export const safeurl=(v:any)=>{let s=clean(v,2000);if(!s)return '';if(s.startsWith('/api/media/'))return s;try{let u=new URL(s);return u.protocol==='https:'?u.href:''}catch{return ''}};
export async function log(h:string,r:string,actor:string,kind:string,body:string){await run('INSERT INTO events VALUES (?,?,?,?,?,?,?)',id(),h,r,actor,kind,body,now());}
export async function rate(key:string,limit=12){await run('INSERT INTO limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN until<? THEN 1 ELSE count+1 END, until=CASE WHEN until<? THEN excluded.until ELSE until END',key,now()+900000,now(),now());let row=await one('SELECT * FROM limits WHERE key=?',key);if(row.count>limit)fail('Too many attempts. Please try again in 15 minutes.',429);}
export const configDefault={wifi:'',password:'',phone:'',address:'',breakfast:'',pool:'',gym:'',checkout:'11:00',policies:'',currency:'INR',timezone:'Asia/Kolkata',accent:'#2459de',image:'',welcome:'Make yourself at home.'};
export const departments=['Reception','Housekeeping','Food & Beverage','Maintenance','Travel','Wellness'];
export const categories=['Room essentials','Housekeeping','Food & drinks','Laundry','Maintenance','Transport','Tours & guides','Activities','Spa & wellness','Celebrations','Reception'];
// Behind the bundled Caddy proxy the real client IP arrives as X-Real-IP (Caddy overwrites any client value).
export const clientIp=(req:Request)=>req.headers.get('x-real-ip')||req.headers.get('cf-connecting-ip')||'local';
