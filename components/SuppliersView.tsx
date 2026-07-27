'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Users, ShieldCheck, Phone, Mail, MapPin, Star, Building2, ExternalLink } from 'lucide-react';

export function SuppliersView() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

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
        console.error('Error fetching suppliers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSuppliers();
  }, []);

  const filteredSuppliers = useMemo(() => {
    if (!search.trim()) return suppliers;
    const term = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.companyName.toLowerCase().includes(term) ||
        s.gstNumber.toLowerCase().includes(term) ||
        s.address.toLowerCase().includes(term) ||
        s.phone.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term)
    );
  }, [suppliers, search]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-2">
            <Users className="h-3.5 w-3.5 text-blue-600" />
            <span>Google Sheet Suppliers Contacts Directory</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Suppliers Directory</h1>
          <p className="text-slate-600 text-xs sm:text-sm">
            Contact information, GSTIN verification, and addresses of all registered solar suppliers ({filteredSuppliers.length} Vendors)
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor name, GSTIN, phone, location..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Supplier Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
          Loading suppliers contact list...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-sm transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-extrabold text-sm shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm leading-tight">
                        {supplier.companyName}
                      </h3>
                      <span className="text-[11px] font-mono text-blue-600 font-bold">
                        GST: {supplier.gstNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 text-xs text-slate-600 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-800">{supplier.phone}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="text-slate-600 truncate">{supplier.email}</span>
                  </div>

                  <div className="flex items-start space-x-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span className="text-slate-600 leading-snug">{supplier.address}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1 text-amber-600 font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{supplier.rating} / 5.0 Rating</span>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ✅ Active Vendor
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
