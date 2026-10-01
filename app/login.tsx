'use client';
import {useState} from 'react';
import {Button,Input,Field,toast} from './shared';

type Mode='login'|'activate'|'register';
const titles:Record<Mode,string>={login:'Staff sign in',activate:'First time? Set your password',register:'Owner setup'};

export default function Login(){
  const [mode,setMode]=useState<Mode>('login'),[form,setForm]=useState<any>({}),[busy,setBusy]=useState(false);
  const update=(k:string,v:string)=>setForm((f:any)=>({...f,[k]:v}));
  const submit=async(e:any)=>{e.preventDefault();setBusy(true);try{
    const r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,action:mode})});
    const d:any=await r.json();if(!r.ok)throw new Error(d.error||'Could not sign in');
    window.location.reload();
  }catch(e:any){toast.error(e.message);setBusy(false)}};
  return <form className="editor login-form" onSubmit={submit}>
    <h2>{titles[mode]}</h2>
    {mode==='register'&&<Field label="Setup key" hint="From the server's OWNER_SETUP_KEY setting."><Input required type="password" value={form.setupKey||''} onChange={e=>update('setupKey',e.target.value)}/></Field>}
    {mode!=='login'&&<Field label="Your name"><Input required={mode==='register'} value={form.name||''} onChange={e=>update('name',e.target.value)}/></Field>}
    <Field label="Email"><Input required type="email" autoComplete="username" value={form.email||''} onChange={e=>update('email',e.target.value)}/></Field>
    {mode==='activate'&&<Field label="Login code" hint="Given to you by your hotel administrator."><Input required autoCapitalize="characters" placeholder="XXXXX-XXXXX" value={form.code||''} onChange={e=>update('code',e.target.value)}/></Field>}
    <Field label={mode==='login'?'Password':'New password'} hint={mode==='login'?undefined:'At least 8 characters.'}><Input required type="password" minLength={mode==='login'?undefined:8} autoComplete={mode==='login'?'current-password':'new-password'} value={form.password||''} onChange={e=>update('password',e.target.value)}/></Field>
    <Button type="submit" disabled={busy} className="full">{busy?'Please wait…':mode==='login'?'Sign in':mode==='activate'?'Set password and sign in':'Create owner account'}</Button>
    <div className="login-links">
      {mode!=='login'&&<button type="button" onClick={()=>setMode('login')}>Back to sign in</button>}
      {mode!=='activate'&&<button type="button" onClick={()=>setMode('activate')}>Have a login code?</button>}
      {mode!=='register'&&<button type="button" onClick={()=>setMode('register')}>Owner setup</button>}
    </div>
  </form>;
}
