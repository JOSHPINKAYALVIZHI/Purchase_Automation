'use client';

import React, { useState } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('Admin');
  const [password, setPassword] = useState<string>('admin_1234');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'EMPLOYEE'>('ADMIN');
  const [error, setError] = useState<string>('');

  const handleSelectRole = (role: 'ADMIN' | 'EMPLOYEE') => {
    setSelectedRole(role);
    setError('');
    if (role === 'ADMIN') {
      setUsername('Admin');
      setPassword('admin_1234');
    } else {
      setUsername('Employee');
      setPassword('employee_2026');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = login(username, password);
    if (!res.success) {
      setError(res.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow Overlay */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 z-10 border border-slate-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img
            src="/jesuans_logo.png"
            alt="JESUANS Solar Make's Bright"
            className="h-12 w-auto mx-auto object-contain drop-shadow-sm"
          />
          <div className="pt-1">
            <h2 className="font-black text-emerald-700 text-2xl tracking-tight">
              Purchase Tracker
            </h2>
            <p className="text-xs text-slate-500 font-bold">
              Solar Procurement & Supplier Management System
            </p>
          </div>
        </div>

        {/* Quick Role Selection Cards */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase text-slate-400 tracking-wider">
            Select Role Account
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSelectRole('ADMIN')}
              className={`p-3.5 rounded-2xl border transition text-left space-y-1 ${
                selectedRole === 'ADMIN'
                  ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <ShieldCheck className={`h-5 w-5 ${selectedRole === 'ADMIN' ? 'text-emerald-600' : 'text-slate-400'}`} />
                {selectedRole === 'ADMIN' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </div>
              <div className="font-extrabold text-xs text-slate-900">👑 Admin</div>
              <div className="text-[10px] text-slate-500 font-medium">Full Access & Approvals</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole('EMPLOYEE')}
              className={`p-3.5 rounded-2xl border transition text-left space-y-1 ${
                selectedRole === 'EMPLOYEE'
                  ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <User className={`h-5 w-5 ${selectedRole === 'EMPLOYEE' ? 'text-emerald-600' : 'text-slate-400'}`} />
                {selectedRole === 'EMPLOYEE' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </div>
              <div className="font-extrabold text-xs text-slate-900">👤 Employee</div>
              <div className="text-[10px] text-slate-500 font-medium">Cart & Request Orders</div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1 text-xs">
            <label className="font-extrabold text-slate-700">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-extrabold text-slate-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition flex items-center justify-center space-x-2"
          >
            <span>Sign In to Purchase Tracker</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center pt-2 text-[11px] text-slate-400 font-semibold border-t border-slate-100">
          Powered by JESUANS ENGINEERING • Enterprise Security
        </div>
      </div>
    </div>
  );
}
