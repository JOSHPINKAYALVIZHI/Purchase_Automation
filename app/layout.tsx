import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProcureAI - Solar Procurement & Supplier Management Platform',
  description: 'AI-Enabled Procurement, Price Comparison & Supplier Management System for Solar Manufacturing Companies',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070A0F] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
