'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  PhoneCall,
  BarChart3,
  ShieldCheck,
  User,
  LogOut,
  Bell,
  CheckCircle2,
  X,
  AlertCircle,
  KeyRound,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const {
    user,
    login,
    logout,
    pendingRequests,
    notifications,
    approveRequest,
    rejectRequest,
    clearNotifications,
  } = useAuth();

  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showApprovalsModal, setShowApprovalsModal] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  const isAdmin = user?.role === 'ADMIN';

  // Navigation Items - Hide "Analysis" tab for Employee role
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'purchase_logs', label: 'Purchase Logs', icon: FileSpreadsheet },
    { id: 'suppliers', label: 'Suppliers', icon: Users },
    { id: 'others', label: 'Contact Details', icon: PhoneCall },
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  ];

  const navItems = allNavItems.filter((item) => {
    if (item.id === 'analysis' && !isAdmin) return false;
    return true;
  });

  const pendingCount = pendingRequests.filter((r) => r.status === 'PENDING').length;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = login(loginUsername, loginPassword);
    if (res.success) {
      setShowLoginModal(false);
      setLoginUsername('');
      setLoginPassword('');
    } else {
      setLoginError(res.error || 'Login failed');
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Title */}
          <div className="flex items-center space-x-3 shrink-0">
            <img
              src="/jesuans_logo.png"
              alt="JESUANS Solar Make's Bright"
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm shrink-0"
            />
            <div className="h-7 w-[2px] bg-slate-300 hidden xl:block" />
            <span className="font-black text-emerald-700 text-lg sm:text-xl tracking-tight hidden xl:block whitespace-nowrap">
              Purchase Tracker
            </span>
          </div>

          {/* Center Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Controls: Admin Approval Badge & User Role Profile Switcher */}
          <div className="flex items-center space-x-3">
            {/* Admin Approval Notification Badge */}
            {isAdmin && (
              <button
                onClick={() => setShowApprovalsModal(true)}
                className="relative px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition flex items-center space-x-2 text-xs sm:text-sm font-extrabold shadow-sm"
                title="Procurement Approvals"
              >
                <Bell className="h-4.5 w-4.5 text-amber-700" />
                <span className="hidden sm:inline">Requests</span>
                {pendingCount > 0 && (
                  <span className="h-5 min-w-[22px] px-1.5 bg-amber-600 text-white rounded-full text-[11px] font-black flex items-center justify-center animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            {/* Current User Session Badge */}
            <div className="flex items-center space-x-3 bg-slate-100 p-2 pl-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm shadow-sm">
              <div className="flex items-center space-x-2 font-black text-slate-900">
                {isAdmin ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                ) : (
                  <User className="h-5 w-5 text-slate-600" />
                )}
                <span>{user?.username || 'Employee'}</span>
              </div>

              <button
                onClick={logout}
                className="px-2.5 py-1 hover:bg-red-100 text-red-700 bg-red-50 border border-red-200 rounded-xl transition flex items-center space-x-1 font-extrabold text-xs"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-between border-t border-slate-100 py-2 overflow-x-auto gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center space-x-1.5 shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🔑 ROLE LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">Role Account Login</h3>
              <p className="text-xs text-slate-500 font-medium">
                Sign in as Admin or Employee to access role permissions
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3 pt-2 text-xs">
              {loginError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700">Username</label>
                <input
                  type="text"
                  placeholder="e.g. Admin or Employee"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  required
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Hardcoded Role Credentials:</div>
                <div className="flex justify-between">
                  <span>👑 Admin:</span>
                  <code className="text-emerald-700 font-mono font-bold">Admin / admin_1234</code>
                </div>
                <div className="flex justify-between">
                  <span>👤 Employee:</span>
                  <code className="text-emerald-700 font-mono font-bold">Employee / employee_2026</code>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-md shadow-emerald-500/20"
              >
                Sign In to Platform
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 📋 ADMIN APPROVALS MODAL */}
      {showApprovalsModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setShowApprovalsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-200 pb-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Employee Procurement Requests</h3>
                <p className="text-xs text-slate-500">
                  Review and approve employee cart orders before sending items to Purchase Logs
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {pendingRequests.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-semibold bg-slate-50 rounded-xl border border-slate-200">
                  No pending employee procurement requests.
                </div>
              ) : (
                pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-4 rounded-2xl border space-y-3 ${
                      req.status === 'PENDING'
                        ? 'bg-amber-50/50 border-amber-200'
                        : req.status === 'APPROVED'
                        ? 'bg-emerald-50/50 border-emerald-200 opacity-75'
                        : 'bg-red-50/50 border-red-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-900">Request #{req.id}</span>
                        <span className="text-slate-500">by {req.employeeName}</span>
                        <span className="text-slate-400">• {req.date}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          req.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    {/* Item list inside request */}
                    <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                      {req.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">
                            {it.name} <span className="text-slate-400 font-normal">x {it.quantity || 1}</span>
                          </span>
                          <span className="text-emerald-700 font-extrabold">
                            ₹{((it.effectivePrice || it.basePrice || 0) * (it.quantity || 1)).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-slate-100 pt-1 flex justify-between font-black text-slate-900 text-xs">
                        <span>Total Order Amount:</span>
                        <span className="text-emerald-700">₹{req.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="flex items-center justify-end space-x-2 pt-1">
                        <button
                          onClick={() => rejectRequest(req.id)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-700 hover:bg-red-50 text-xs font-extrabold"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => approveRequest(req.id)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
                        >
                          Approve Order & Send to Log
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowApprovalsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
