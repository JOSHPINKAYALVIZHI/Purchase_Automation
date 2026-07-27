'use client';

import React from 'react';
import { SimpleProductComparer } from '@/components/SimpleProductComparer';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 antialiased py-6">
      <SimpleProductComparer />
    </main>
  );
}
