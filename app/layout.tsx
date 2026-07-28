import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Janatha Garage Member Management Portal',
  description: 'Official Janatha Garage Member Portal for Registration, Verification, ID Cards, and Administration.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
