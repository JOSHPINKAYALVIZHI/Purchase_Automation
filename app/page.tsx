'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardView } from '@/components/DashboardView';
import { SupplierComparisonView } from '@/components/SupplierComparisonView';
import { QuotationOCRView } from '@/components/QuotationOCRView';
import { AIChatView } from '@/components/AIChatView';
import { InventoryView } from '@/components/InventoryView';
import { PurchaseOrdersView } from '@/components/PurchaseOrdersView';
import { SuppliersView } from '@/components/SuppliersView';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentRole, setCurrentRole] = useState<string>('PURCHASE_MANAGER');

  return (
    <div className="flex h-screen bg-[#070A0F] text-slate-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentRole={currentRole} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header currentRole={currentRole} setCurrentRole={setCurrentRole} />

        {/* Tab Content Renderer */}
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
  );
}
