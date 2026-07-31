import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Purchase Tracker - JESUANS Solar',
  description: 'Solar Procurement, Purchase Tracking & Supplier Management Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="bg-[#070A0F] text-slate-100 antialiased min-h-screen"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
