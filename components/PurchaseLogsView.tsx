'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileSpreadsheet, Filter, Download, ArrowUpDown } from 'lucide-react';

export function PurchaseLogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const res = await fetch('/api/suppliers');
        const json = await res.json();
        if (json.success) {
          const allQuotationLogs: any[] = [];
          json.data.forEach((s: any) => {
            if (s.products && s.products.length > 0) {
              s.products.forEach((sp: any) => {
                allQuotationLogs.push({
                  id: sp.id,
                  supplierName: s.companyName,
                  gstNumber: s.gstNumber,
                  phone: s.phone,
                  address: s.address,
                  productName: sp.product?.name || 'Solar Material',
                  category: sp.product?.category || 'Equipment',
                  specification: sp.product?.specification || 'Standard Spec',
                  brand: sp.product?.brand || 'Standard Make',
                  hsn: sp.product?.hsn || '8541',
                  basePrice: sp.basePrice,
                  gstPercentage: sp.gstPercentage,
                  effectivePrice: sp.effectivePrice,
                  invoiceNo: sp.invoiceNo || 'FSCH/00139/25-26',
                  discount: sp.discount || '—',
                  date: sp.updatedAt ? new Date(sp.updatedAt).toLocaleDateString('en-IN') : '2026-07-24',
                });
              });
            }
          });
          setLogs(allQuotationLogs);
        }
      } catch (err) {
        console.error('Error loading purchase logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.category));
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
      const matchesSearch =
        search === '' ||
        log.supplierName.toLowerCase().includes(search.toLowerCase()) ||
        log.productName.toLowerCase().includes(search.toLowerCase()) ||
        log.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
        log.hsn.toLowerCase().includes(search.toLowerCase()) ||
        log.brand.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [logs, categoryFilter, search]);

  const handleExportCSV = () => {
    if (!filteredLogs || filteredLogs.length === 0) return;
    const headers = [
      'Invoice No',
      'Date',
      'Vendor / Company',
      'Category',
      'HSN Code',
      'Material / Item Name',
      'Specification',
      'Make / Brand',
      'Base Rate',
      'GST %',
      'With GST Rate',
      'Total Amount',
      'Discount',
    ];

    const rows = filteredLogs.map((l) => [
      `"${l.invoiceNo || ''}"`,
      `"${l.date || ''}"`,
      `"${(l.supplierName || '').replace(/"/g, '""')}"`,
      `"${(l.category || '').replace(/"/g, '""')}"`,
      `"${l.hsn || ''}"`,
      `"${(l.productName || '').replace(/"/g, '""')}"`,
      `"${(l.specification || '').replace(/"/g, '""')}"`,
      `"${(l.brand || '').replace(/"/g, '""')}"`,
      l.basePrice || 0,
      l.gstPercentage || 18,
      l.effectivePrice || 0,
      l.totalAmount || 0,
      `"${l.discount || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Purchase_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Category Dropdown, Search Bar & Export CSV Button Row */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        {/* Category Dropdown */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs sm:text-sm rounded-xl pl-10 pr-8 py-2.5 appearance-none focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">▼</span>
        </div>

        {/* Text Search */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice no, vendor name, item, HSN code, make..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
          />
        </div>

        {/* Export CSV Button */}
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition flex items-center space-x-2 shrink-0 shadow-sm shadow-emerald-500/20 w-full sm:w-auto justify-center"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Purchase Log Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
          Loading purchase log table from vendor list...
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[65vh]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[11px] z-10">
                <tr>
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 px-3">Vendor / Company</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">HSN Code</th>
                  <th className="py-3.5 px-3">Material / Item Name</th>
                  <th className="py-3.5 px-3">Specification</th>
                  <th className="py-3.5 px-3">Make</th>
                  <th className="py-3.5 px-3">Unit Rate</th>
                  <th className="py-3.5 px-3">GST %</th>
                  <th className="py-3.5 px-3 text-emerald-700">With GST Rate</th>
                  <th className="py-3.5 px-3 text-emerald-700">Discount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">{log.invoiceNo}</td>
                    <td className="py-3 px-3 text-slate-500">{log.date}</td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">{log.supplierName}</td>
                    <td className="py-3 px-3 text-slate-600 font-semibold">{log.category}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{log.hsn}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{log.productName}</td>
                    <td className="py-3 px-3 text-slate-600">{log.specification}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{log.brand}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">₹{log.basePrice.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-slate-600">{log.gstPercentage}%</td>
                    <td className="py-3 px-3 font-black text-emerald-700">₹{log.effectivePrice.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 font-bold text-emerald-600">{log.discount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
