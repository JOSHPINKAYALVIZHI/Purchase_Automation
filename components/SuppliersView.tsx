'use client';

import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Star, Mail, Phone, MapPin } from 'lucide-react';

export function SuppliersView() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadSuppliers() {
      try {
        setLoading(true);
        const res = await fetch('/api/suppliers');
        const json = await res.json();
        if (json.success) {
          setSuppliers(json.data);
        }
      } catch (err) {
        console.error('Error loading suppliers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSuppliers();
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Verified Solar Vendors
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
          Suppliers Directory
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Centralized vendor database with GST numbers, contact info, ratings, and performance metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading suppliers...</div>
        ) : (
          suppliers.map((s) => (
            <div key={s.id} className="glass-panel glass-card-hover rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-snug">{s.companyName}</h3>
                    <span className="text-[10px] font-bold text-emerald-400 font-mono">GST: {s.gstNumber}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  ⭐ {s.rating}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Mail className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{s.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-400">
                  <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>{s.phone}</span>
                </div>
                <div className="flex items-start space-x-2 text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{s.address}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-[11px]">
                <span className="text-slate-400">Quoted Products: <strong className="text-white">{s.products?.length || 0}</strong></span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified Vendor
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
