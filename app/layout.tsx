import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'جوس لاين | النظام المالي 2026',icons:{icon:'/favicon.svg'},description:'النظرة المالية العامة والإيرادات والمصروفات وإدخال البيانات لجوس لاين لسنة 2026.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body>{children}</body></html>}
