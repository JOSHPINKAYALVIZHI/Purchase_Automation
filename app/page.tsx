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
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
      {/* Top Mode Switcher Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between z-40 sticky top-0 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            ⚡
          </div>
          <span className="text-sm font-black text-slate-900">ProcureAI</span>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('simple')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'simple'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Simple Low-to-High Price List</span>
          </button>
          <button
            onClick={() => setViewMode('pro')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'pro'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Full Pro Dashboard</span>
          </button>
        </div>
      </div>

      {/* Main View */}
      {viewMode === 'simple' ? (
        <div className="flex-1 py-4">
          <SimpleProductComparer />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden bg-slate-900 text-slate-100">
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
