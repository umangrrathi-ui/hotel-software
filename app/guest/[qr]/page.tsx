import Guest from '@/app/guest';
export const dynamic='force-dynamic';
export default async function Page({params}:any){const p=await params;return <Guest qr={p.qr}/>}
