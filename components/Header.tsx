'use client';

import React, { useState } from 'react';
import { Search, Bell, Shield, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentRole: string;
  setCurrentRole: (role: string) => void;
  onSearch?: (query: string) => void;
}

export function Header({ currentRole, setCurrentRole, onSearch }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const roles = [
    { id: 'PURCHASE_MANAGER', label: 'Purchase Manager (Rajesh)' },
    { id: 'ADMIN', label: 'Admin (System)' },
    { id: 'WAREHOUSE', label: 'Warehouse Staff (Suresh)' },
    { id: 'FINANCE', label: 'Finance (Priya)' },
    { id: 'SUPPLIER', label: 'Supplier Portal (ABC Solar)' },
  ];

  const notifications = [
    { id: 1, title: 'Price Reduced Alert', desc: 'ABC Solar updated 550W Mono Panel to ₹14,000', time: '10m ago', type: 'info' },
    { id: 2, title: 'Reorder Level Alert', desc: '540W Mono Panel stock (35) below min threshold (40)', time: '1h ago', type: 'warning' },
    { id: 3, title: 'PO Approved', desc: 'PO-2026-00125 approved by Finance team', time: '3h ago', type: 'success' },
  ];

  return (
    <header className="h-16 glass-panel border-b border-slate-800 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Search Input */}
      <div className="relative w-72 md:w-96">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search products, suppliers, GST numbers, POs..."
          onChange={(e) => onSearch && onSearch(e.target.value)}
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition"
        />
      </div>

      {/* Action Buttons & Notifications */}
      <div className="flex items-center space-x-4">
        {/* Role Selector */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 transition"
          >
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-medium hidden sm:inline">{roles.find((r) => r.id === currentRole)?.label.split(' ')[0]}</span>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-64 glass-panel bg-[#0D131F] border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50">
              <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                Switch User Role Perspective
              </div>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setCurrentRole(r.id);
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                    currentRole === r.id ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{r.label}</span>
                  {currentRole === r.id && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 glass-panel bg-[#0D131F] border border-slate-800 rounded-xl shadow-2xl p-3 z-50 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">FCM Notifications</h4>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Live Feed
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between text-slate-200 font-semibold">
                      <span className="flex items-center gap-1.5">
                        {n.type === 'warning' ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-500">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
