'use client';

import React from 'react';
import {
  LayoutDashboard,
  Search,
  FileSpreadsheet,
  Bot,
  Package,
  FileText,
  Users,
  Sun,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: string;
}

export function Sidebar({ activeTab, setActiveTab, currentRole }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'comparison', label: 'Supplier Comparison', icon: Search, badge: 'Flipkart-style' },
    { id: 'ocr', label: 'Quotation OCR Upload', icon: FileSpreadsheet, badge: 'AI Parser' },
    { id: 'ai-chat', label: 'AI Procurement Assistant', icon: Bot, badge: 'Smart' },
    { id: 'inventory', label: 'Inventory & Reorders', icon: Package },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: FileText },
    { id: 'suppliers', label: 'Suppliers Directory', icon: Building2 },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between shrink-0 hidden md:flex">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sun className="h-6 w-6 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-wide flex items-center gap-1.5">
              Procure<span className="text-emerald-400">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Solar Procurement Operating System</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Footer */}
      <div className="p-4 m-4 rounded-xl glass-card border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-slate-400">Current Role Context</p>
            <p className="text-xs font-semibold text-emerald-300 truncate">{currentRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
