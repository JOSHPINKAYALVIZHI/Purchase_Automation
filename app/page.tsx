'use client';

import React, { useState } from 'react';
import { AuthProvider } from '@/lib/AuthContext';
import { Navbar } from '@/components/Navbar';
import { SimpleProductComparer } from '@/components/SimpleProductComparer';
import { PurchaseLogsView } from '@/components/PurchaseLogsView';
import { SuppliersView } from '@/components/SuppliersView';
import { OthersView } from '@/components/OthersView';
import { AnalysisView } from '@/components/AnalysisView';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
        {/* Top Menu Navigation Bar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Tab Content */}
        <main className="flex-1 py-6">
          {activeTab === 'dashboard' && <SimpleProductComparer />}
          {activeTab === 'purchase_logs' && <PurchaseLogsView />}
          {activeTab === 'suppliers' && <SuppliersView />}
          {activeTab === 'others' && <OthersView />}
          {activeTab === 'analysis' && <AnalysisView />}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          PURCHASE TRACKER • Powered by JESUANS ENGINEERING
        </footer>
      </div>
    </AuthProvider>
  );
}
