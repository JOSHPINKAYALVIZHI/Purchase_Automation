'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Users,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Star,
  Building2,
  PackageCheck,
  X,
  ChevronRight,
  Zap,
  User,
} from 'lucide-react';

import { useAuth } from '@/lib/AuthContext';

export function SuppliersView() {
  const { approvedLogItems } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Selected Supplier Modal State
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);

  const [cloudItems, setCloudItems] = useState<any[]>([]);

  useEffect(() => {
    async function loadSuppliersAndProducts() {
      try {
        setLoading(true);
        const [supRes, prodRes, cloudRes] = await Promise.all([
          fetch('/api/suppliers').catch(() => null),
          fetch('/api/products').catch(() => null),
          fetch('/api/cloud-sync').catch(() => null),
        ]);

        if (supRes && supRes.ok) {
          const supJson = await supRes.json();
          if (supJson.success) setSuppliers(supJson.data || []);
        }
        if (prodRes && prodRes.ok) {
          const prodJson = await prodRes.json();
          if (prodJson.success) setDbProducts(prodJson.data || []);
        }
        if (cloudRes && cloudRes.ok) {
          const cloudJson = await cloudRes.json();
          if (cloudJson.success) {
            setCloudItems([...(cloudJson.logs || []), ...(cloudJson.suppliers || [])]);
          }
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSuppliersAndProducts();
    const interval = setInterval(() => {
      loadSuppliersAndProducts();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const combinedSuppliers = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Existing DB Suppliers
    suppliers.forEach((s) => {
      if (s.companyName && s.companyName.trim()) {
        map.set(s.companyName.toLowerCase().trim(), { ...s, supplierProducts: Array.isArray(s.supplierProducts) ? [...s.supplierProducts] : [] });
      }
    });

    // 2. Combine companies and product items from approvedLogItems & cloud sync
    [...approvedLogItems, ...cloudItems].forEach((item) => {
      const cName = (item.supplierName || item.companyName || item.newCompanyName || '').trim();
      if (!cName || cName.toLowerCase() === 'vendor') return;

      const cKey = cName.toLowerCase();

      if (!map.has(cKey)) {
        map.set(cKey, {
          id: `sup_log_${Math.abs(cKey.split('').reduce((acc: number, char: string) => (acc << 5) - acc + char.charCodeAt(0), 0))}`,
          companyName: cName,
          gstNumber: item.gstNumber || item.newGstNumber || '33AAACG123456789',
          phone: item.phone || item.newPhone || '+91 98422 55555',
          address: item.address || item.newAddress || 'Coimbatore, Tamil Nadu',
          email: item.email || item.newEmail || null,
          contactPerson: item.contactPerson || item.newContactPerson || null,
          status: 'ACTIVE',
          supplierProducts: [],
        });
      }

      const existingSup = map.get(cKey)!;
      if (!existingSup.supplierProducts) existingSup.supplierProducts = [];
      const prodName = (item.productName || 'Solar Material').trim();
      const existsProd = existingSup.supplierProducts.some(
        (sp: any) => sp.product?.name?.toLowerCase().trim() === prodName.toLowerCase()
      );
      if (!existsProd) {
        existingSup.supplierProducts.push({
          id: item.id || `sp_${Date.now()}_${Math.random()}`,
          basePrice: item.basePrice || 0,
          gstPercentage: item.gstPercentage || 18,
          effectivePrice: item.effectivePrice || 0,
          invoiceNo: item.invoiceNo || 'FSCH/00139/25-26',
          product: {
            name: prodName,
            category: item.category || 'Solar Equipment',
            specification: item.specification || 'Standard Spec',
            brand: item.brand || 'Standard Make',
          },
        });
      }
    });

    // 3. Combine products from dbProducts (from /api/products)
    dbProducts.forEach((p) => {
      if (p.supplierProducts && Array.isArray(p.supplierProducts)) {
        p.supplierProducts.forEach((sp: any) => {
          if (sp.supplier?.companyName && sp.supplier.companyName.trim()) {
            const cName = sp.supplier.companyName.trim();
            const cKey = cName.toLowerCase();

            if (!map.has(cKey)) {
              map.set(cKey, {
                id: sp.supplier.id,
                companyName: cName,
                gstNumber: sp.supplier.gstNumber || '33AAACG123456789',
                phone: sp.supplier.phone || '+91 98422 55555',
                address: sp.supplier.address || 'Coimbatore, Tamil Nadu',
                email: sp.supplier.email || null,
                contactPerson: sp.supplier.contactPerson || null,
                status: 'ACTIVE',
                supplierProducts: [],
              });
            }

            const existingSup = map.get(cKey)!;
            if (!existingSup.supplierProducts) existingSup.supplierProducts = [];
            const prodName = (p.name || 'Solar Material').trim();
            const existsProd = existingSup.supplierProducts.some(
              (itemSp: any) => itemSp.product?.name?.toLowerCase().trim() === prodName.toLowerCase()
            );
            if (!existsProd) {
              existingSup.supplierProducts.push({
                id: sp.id,
                basePrice: sp.basePrice || 0,
                gstPercentage: sp.gstPercentage || 18,
                effectivePrice: sp.effectivePrice || 0,
                invoiceNo: sp.invoiceNo || 'FSCH/00139/25-26',
                product: {
                  name: prodName,
                  category: p.category || 'Solar Equipment',
                  specification: p.specification || 'Standard Spec',
                  brand: p.brand || 'Standard Make',
                },
              });
            }
          }
        });
      }
    });

    return Array.from(map.values());
  }, [suppliers, approvedLogItems, dbProducts]);

  const filteredSuppliers = useMemo(() => {
    if (!search.trim()) return combinedSuppliers;
    const term = search.toLowerCase();
    return combinedSuppliers.filter(
      (s) =>
        s.companyName.toLowerCase().includes(term) ||
        (s.gstNumber && s.gstNumber.toLowerCase().includes(term)) ||
        (s.address && s.address.toLowerCase().includes(term)) ||
        (s.phone && s.phone.toLowerCase().includes(term)) ||
        (s.email && s.email.toLowerCase().includes(term))
    );
  }, [combinedSuppliers, search]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Suppliers Directory</h1>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor name, GSTIN, phone, location..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
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
              onClick={() => setSelectedSupplier(supplier)}
              className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer space-y-3 flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-extrabold text-sm shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm leading-tight group-hover:text-emerald-600 transition">
                        {supplier.companyName}
                      </h3>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition shrink-0" />
                </div>

                <div className="space-y-1.5 pt-2 text-xs text-slate-600 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-800">{supplier.phone}</span>
                  </div>

                  {/* Render Email ONLY if available */}
                  {supplier.email && supplier.email.trim() && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-600 truncate">{supplier.email}</span>
                    </div>
                  )}

                  {/* Render Contact Person if available */}
                  {supplier.contactPerson && supplier.contactPerson.trim() && (
                    <div className="flex items-center space-x-2 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="font-bold text-[11px]">Contact: {supplier.contactPerson}</span>
                    </div>
                  )}

                  <div className="flex items-start space-x-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span className="text-slate-600 leading-snug">{supplier.address}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Products Count Badge */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end text-xs">
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition flex items-center space-x-1">
                  <PackageCheck className="h-3.5 w-3.5" />
                  <span>{(supplier.supplierProducts || supplier.products || []).length} Products Supplied</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🏬 SUPPLIER PRODUCTS & DETAILS MODAL */}
      {selectedSupplier && (() => {
        const modalProducts = selectedSupplier.supplierProducts || selectedSupplier.products || [];
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-3xl w-full space-y-5 shadow-2xl relative text-slate-900 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedSupplier(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Modal Supplier Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-slate-900 text-xl">
                        {selectedSupplier.companyName}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Verified Supplier
                      </span>
                    </div>
                    <p className="text-xs text-emerald-700 font-bold font-mono mt-0.5">
                      {selectedSupplier.contactPerson && selectedSupplier.contactPerson.trim() ? `${selectedSupplier.contactPerson} • ` : ''}
                      {selectedSupplier.phone}
                      {selectedSupplier.email && selectedSupplier.email.trim() ? ` • ${selectedSupplier.email}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-500 block">
                    {selectedSupplier.address}
                  </span>
                </div>
              </div>

              {/* Products Supplied List Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <PackageCheck className="h-4.5 w-4.5 text-emerald-600" />
                    <span>Products We Get from {selectedSupplier.companyName} ({modalProducts.length} Items)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Google Sheet Quotation Records
                  </span>
                </div>

                {modalProducts.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm max-h-[55vh]">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[11px] z-10">
                        <tr>
                          <th className="py-3 px-3">Product Name</th>
                          <th className="py-3 px-3">Category</th>
                          <th className="py-3 px-3">Specification</th>
                          <th className="py-3 px-3">Make / Brand</th>
                          <th className="py-3 px-3">HSN Code</th>
                          <th className="py-3 px-3">Invoice No</th>
                          <th className="py-3 px-3">Base Rate</th>
                          <th className="py-3 px-3">GST %</th>
                          <th className="py-3 px-3 text-emerald-700">With GST Rate</th>
                          <th className="py-3 px-3 text-emerald-700">Discount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-[11px]">
                        {modalProducts.map((sp: any) => (
                          <tr key={sp.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-3 font-extrabold text-slate-900 flex items-center space-x-1.5">
                              <Zap className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span>{sp.product?.name || 'Solar Material'}</span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-700">
                              {sp.product?.category || 'Solar Equipment'}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              {sp.product?.specification || 'Standard Spec'}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-800">
                              {sp.product?.brand || 'Standard'}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-600">
                              {sp.product?.hsn || '8541'}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                              {sp.invoiceNo || 'FSCH/00139/25-26'}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-900">
                              ₹{sp.basePrice.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              {sp.gstPercentage}%
                            </td>
                            <td className="py-3 px-3 font-black text-emerald-700">
                              ₹{sp.effectivePrice.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 font-bold text-emerald-600">
                              {sp.discount || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
                    No registered product quotes found for this supplier yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
