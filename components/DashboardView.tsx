'use client';

import React from 'react';
import {
  Building2,
  Package,
  TrendingUp,
  AlertTriangle,
  Receipt,
  ArrowUpRight,
  ShieldAlert,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
}

export function DashboardView({ setActiveTab }: DashboardViewProps) {
  const kpis = [
    { title: 'Total Suppliers', value: '5 Active', subText: '100% GST Verified', icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { title: 'Active Products', value: '7 Items', subText: 'Panels, Inverters, Cables', icon: Package, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { title: 'Purchase This Month', value: '₹4,87,170', subText: '+14% vs last month', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { title: 'Reorder Alerts', value: '2 Products', subText: '540W Panel & DC Cable', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { title: 'GST Summary', value: '₹58,460', subText: 'Input Tax Credit Eligible', icon: Receipt, color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  ];

  const lowStockItems = [
    { name: '540W Monocrystalline Solar Panel', current: 35, min: 40, shortage: 5, unit: 'Pcs' },
    { name: '4 sq mm Solar DC Cable (100m Roll)', current: 15, min: 20, shortage: 5, unit: 'Roll' },
  ];

  const recentPOs = [
    { id: 'PO-2026-00125', supplier: 'ABC Solar Technologies Ltd', items: '550W Mono Panel (10 Pcs)', total: '₹1,56,800', date: '2026-07-24', status: 'APPROVED' },
    { id: 'PO-2026-00126', supplier: 'Apex Solar Accessories', items: 'MC4 Connector Pair (1000 Pair)', total: '₹19,950', date: '2026-07-24', status: 'PENDING' },
    { id: 'PO-2026-00124', supplier: 'Rays Energy Solutions', items: '10kW Grid Inverter (4 Pcs)', total: '₹2,36,000', date: '2026-07-01', status: 'DELIVERED' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Executive Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel border border-slate-800 p-6 md:p-8">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ProcureAI Executive Portal
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-2">
              Good Morning, <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">Rajesh Sharma</span> 👋
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Procurement & Supplier Intelligence System for Solar Manufacturing Operations.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('comparison')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-semibold text-xs md:text-sm hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20 transition"
            >
              <Search className="h-4 w-4" />
              <span>Compare Prices</span>
            </button>
            <button
              onClick={() => setActiveTab('ocr')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs md:text-sm hover:bg-slate-700 transition"
            >
              <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
              <span>OCR PDF Upload</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{kpi.title}</span>
                <div className={`p-2 rounded-xl border ${kpi.bg}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl font-bold text-white tracking-tight">{kpi.value}</h3>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">{kpi.subText}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Dashboard Grid: Low Stock Alert & Recent POs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Reorder Alerts & Stock Monitor (1 col) */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl border border-slate-800 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-base">Low Stock Reorder Alerts</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                2 Items
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {lowStockItems.map((item, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-bold text-slate-200">{item.name}</p>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Shortage: -{item.shortage} {item.unit}
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-400 h-2 rounded-full"
                      style={{ width: `${(item.current / item.min) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Stock: <strong className="text-slate-200">{item.current}</strong></span>
                    <span>Min Threshold: <strong className="text-slate-200">{item.min}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('inventory')}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-emerald-400 hover:border-slate-700 transition flex items-center justify-center space-x-1.5"
            >
              <span>Manage Inventory</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Recent Purchase Orders (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl border border-slate-800 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-slate-100 text-base">Recent Purchase Orders</h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time status of solar material procurement</p>
              </div>
              <button
                onClick={() => setActiveTab('purchase-orders')}
                className="text-xs font-semibold text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <span>View All POs</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <th className="pb-3 font-semibold">PO Number</th>
                    <th className="pb-3 font-semibold">Supplier</th>
                    <th className="pb-3 font-semibold">Items</th>
                    <th className="pb-3 font-semibold">Total Amount</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentPOs.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 font-bold text-emerald-300">{po.id}</td>
                      <td className="py-3.5 text-slate-200 font-medium">{po.supplier}</td>
                      <td className="py-3.5 text-slate-400">{po.items}</td>
                      <td className="py-3.5 text-slate-100 font-bold">{po.total}</td>
                      <td className="py-3.5 text-right">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            po.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : po.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {po.status === 'APPROVED' ? (
                            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-400" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1 text-amber-400" />
                          )}
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
