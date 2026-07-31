'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both Username and Password');
      return;
    }

    const res = login(username, password);
    if (!res.success) {
      setError(res.error || 'Invalid Username or Password');
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

        {/* Login Form (Empty Fields - User Must Enter) */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5 text-xs">
            <label className="font-extrabold text-slate-700 block">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Enter your username (e.g. Admin or Employee)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-emerald-600 text-xs placeholder:font-normal placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-extrabold text-slate-700 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-emerald-600 text-xs placeholder:font-normal placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition flex items-center justify-center space-x-2 mt-2"
          >
            <span>Sign In to Platform</span>
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
