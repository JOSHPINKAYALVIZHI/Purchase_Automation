'use client';

import React from 'react';
import { Layers, FileText, CheckCircle2, ShieldCheck, Truck, CreditCard, Award } from 'lucide-react';

export function OthersView() {
  const categoriesList = [
    { name: 'Solar Panel / Modules', count: '94 Items', desc: 'Bifacial 550W DCR, Adani, Goldi, Waaree, Rayzon, Vikram' },
    { name: 'Inverters (1Ph & 3Ph)', count: '48 Items', desc: 'DEYE, Havells, Polycab, Sofar, Growatt Ongrid/Hybrid' },
    { name: 'DCDB & ACDB Boxes', count: '32 Items', desc: 'Sree Murugan, Efflex Electricals, IP65 Weatherproof' },
    { name: 'DC Cables & Wires', count: '28 Items', desc: 'Polycab 4 SQ.mm & 6 SQ.mm Twin Core Copper/Aluminum' },
    { name: 'Structure & Steels', count: '25 Items', desc: 'Hot Dip Galvanized Module Mounting Structure (MMS)' },
    { name: 'Electrical & Hardware', count: '58 Items', desc: 'MC4 Ningbo Connectors, Dowells Lugs, Lightning Arresters' },
  ];

  const vendorPolicies = [
    { icon: ShieldCheck, title: 'GSTIN Compliance', text: '100% verified 15-digit GSTIN active registration on GST portal.' },
    { icon: Truck, title: 'Standard Dispatch', text: 'Avg 1 to 5 Days dispatch lead time from Coimbatore & Chennai warehouses.' },
    { icon: CreditCard, title: 'Payment Terms', text: 'Advance / 30-Day Credit limit available for approved purchase orders.' },
    { icon: Award, title: 'Warranty Support', text: '25-Year performance warranty on panels; 5 to 10 years on inverters.' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-2">
          <Layers className="h-3.5 w-3.5 text-blue-600" />
          <span>Google Sheet Additional Tabs & Procurement Terms</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Other Supplier Details & Guidelines</h1>
        <p className="text-slate-600 text-xs sm:text-sm">
          Overview of category distributions, lead times, payment terms, and vendor SLA policies.
        </p>
      </div>

      {/* Category Breakdowns */}
      <div className="space-y-3">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span>Procurement Categories Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesList.map((cat, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm">{cat.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {cat.count}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{cat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SLA & Terms Grid */}
      <div className="space-y-3 pt-2">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
          <span>Vendor Procurement & SLA Policies</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendorPolicies.map((pol, idx) => {
            const Icon = pol.icon;
            return (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-start space-x-3.5">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{pol.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{pol.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
