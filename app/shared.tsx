'use client';
import { Select,SelectTrigger,SelectValue,SelectContent,SelectItem } from '@/components/ui/select';
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
export {Button,Input,Textarea,toast};
export const cats=['Room essentials','Housekeeping','Food & drinks','Laundry','Maintenance','Transport','Tours & guides','Activities','Spa & wellness','Celebrations','Reception'];
export const deps=['Reception','Housekeeping','Food & Beverage','Maintenance','Travel','Wellness'];
export const modes=['Free','Fixed price','Per item','Per person','Per hour','Per trip','Package','Quote required'];
export const money=(n:any,c='INR')=>n===null?'Quote required':new Intl.NumberFormat('en-IN',{style:'currency',currency:c,maximumFractionDigits:2}).format((Number(n)||0)/100);
export const date=(n:any)=>new Date(n).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
export const j=(s:any)=>{try{return typeof s==='string'?JSON.parse(s):s||{}}catch{return {}}};
export const closed=(r:any)=>['Completed','Rejected','Cancelled'].includes(r.status);
export async function call(b:any){let r=await fetch('/api/desk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});let d:any=await r.json();if(!r.ok)throw new Error(d.error||'Could not save');return d;}
export function Field({label,children,hint}:any){return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>}
export function Pick({value,onChange,options,placeholder='Choose',disabled=false}:any){return <Select value={value||undefined} onValueChange={onChange} disabled={disabled}><SelectTrigger className="pick"><SelectValue placeholder={placeholder}/></SelectTrigger><SelectContent>{options.map((o:any)=><SelectItem key={o.value||o} value={o.value||o}>{o.label||o}</SelectItem>)}</SelectContent></Select>}
export function Modal({title,description,open,onClose,children}:any){return <Dialog open={open} onOpenChange={v=>!v&&onClose()}><DialogContent className="modal"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description||'Review the details below.'}</DialogDescription></DialogHeader>{children}</DialogContent></Dialog>}
export function Badge({status}:any){return <span className={'badge '+String(status).toLowerCase().replace(/ /g,'-')}>{status}</span>}
export function Empty({icon:Icon,title,body,children}:any){return <div className="empty">{Icon&&<Icon size={32}/>}<h3>{title}</h3><p>{body}</p>{children}</div>}
