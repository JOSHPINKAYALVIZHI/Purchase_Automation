'use client';

import React, { useState } from 'react';
import { SimpleProductComparer } from '@/components/SimpleProductComparer';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardView } from '@/components/DashboardView';
import { SupplierComparisonView } from '@/components/SupplierComparisonView';
import { QuotationOCRView } from '@/components/QuotationOCRView';
import { AIChatView } from '@/components/AIChatView';
import { InventoryView } from '@/components/InventoryView';
import { PurchaseOrdersView } from '@/components/PurchaseOrdersView';
import { SuppliersView } from '@/components/SuppliersView';
import { LayoutDashboard, Zap } from 'lucide-react';

export default function Home() {
  const [viewMode, setViewMode] = useState<'simple' | 'pro'>('simple');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentRole, setCurrentRole] = useState<string>('PURCHASE_MANAGER');

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 antialiased flex flex-col">
      {/* Top Mode Switcher Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between z-40 sticky top-0 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            ⚡
          </div>
          <span className="text-xs font-bold text-slate-200">ProcureAI</span>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('simple')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'simple'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Simple Low-to-High Finder</span>
          </button>
          <button
            onClick={() => setViewMode('pro')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'pro'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Full Pro Portal</span>
          </button>
        </div>
      </div>

      {/* Main View Mode */}
      {viewMode === 'simple' ? (
        <div className="flex-1 py-4">
          <SimpleProductComparer />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentRole={currentRole} />
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            <Header currentRole={currentRole} setCurrentRole={setCurrentRole} />
            <main className="flex-1 pb-12">
              {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
              {activeTab === 'comparison' && <SupplierComparisonView setActiveTab={setActiveTab} />}
              {activeTab === 'ocr' && <QuotationOCRView setActiveTab={setActiveTab} />}
              {activeTab === 'ai-chat' && <AIChatView />}
              {activeTab === 'inventory' && <InventoryView />}
              {activeTab === 'purchase-orders' && <PurchaseOrdersView />}
              {activeTab === 'suppliers' && <SuppliersView />}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
