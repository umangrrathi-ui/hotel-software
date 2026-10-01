import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
export const metadata:Metadata={title:'Hotel Service Desk',description:'Guest concierge and hotel service operations',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<Toaster richColors position="top-right"/></body></html>}
