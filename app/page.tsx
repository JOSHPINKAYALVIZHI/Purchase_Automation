'use client';

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { Navbar } from '@/components/Navbar';
import { SimpleProductComparer } from '@/components/SimpleProductComparer';
import { PurchaseLogsView } from '@/components/PurchaseLogsView';
import { SuppliersView } from '@/components/SuppliersView';
import { OthersView } from '@/components/OthersView';
import { AnalysisView } from '@/components/AnalysisView';
import { LoginScreen } from '@/components/LoginScreen';

function MainApp() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  // If user is not logged in, block and show full screen login screen
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
      {/* Top Menu Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Tab Content */}
      <main className="flex-1 py-6">
        {activeTab === 'dashboard' && <SimpleProductComparer />}
        {activeTab === 'purchase_logs' && <PurchaseLogsView />}
        {activeTab === 'suppliers' && <SuppliersView />}
        {activeTab === 'others' && <OthersView />}
        {activeTab === 'analysis' && user.role === 'ADMIN' && <AnalysisView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        JESUANS ERP • Powered by JESUANS ENGINEERING
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
