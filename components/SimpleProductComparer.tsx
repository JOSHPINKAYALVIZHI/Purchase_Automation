'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Zap,
  Trophy,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Star,
  CheckCircle2,
  X,
  Filter,
  FileText,
  Clock,
  Building2,
  History,
  Receipt,
  ListFilter,
  FileSpreadsheet,
} from 'lucide-react';

export function SimpleProductComparer() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Order Modal State
  const [showPOModal, setShowPOModal] = useState<boolean>(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(10);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // Card View Log Modal State (Filtered to searched product ONLY)
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [logCompanyOffer, setLogCompanyOffer] = useState<any>(null);

  // Overall Log Modal State (Complete overall history)
  const [showOverallLogModal, setShowOverallLogModal] = useState<boolean>(false);
  const [overallLogs, setOverallLogs] = useState<any[]>([]);
  const [overallLogSearch, setOverallLogSearch] = useState<string>('');
  const [loadingOverallLogs, setLoadingOverallLogs] = useState<boolean>(false);

  // Load products from database
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setProducts(json.data);
          setSelectedProduct(json.data[0]);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Compute unique Categories dynamically
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        cats.add(p.category.trim());
      }
    });
    return Array.from(cats).sort();
  }, [products]);

  // Filter products by selected category dropdown & search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'ALL' || p.category.trim() === selectedCategory;

      const matchesSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  useEffect(() => {
    if (
      filteredProducts.length > 0 &&
      (!selectedProduct || !filteredProducts.some((p) => p.id === selectedProduct.id))
    ) {
      setSelectedProduct(filteredProducts[0]);
    }
  }, [filteredProducts, selectedProduct]);

  // Fetch and sort offers Low to High for selected product
  useEffect(() => {
    if (!selectedProduct) return;
    async function loadOffers() {
      try {
        setLoading(true);
        const res = await fetch(`/api/quotations?productId=${selectedProduct.id}`);
        const json = await res.json();
        if (json.success) {
          const sorted = (json.data.quotations || []).sort(
            (a: any, b: any) => a.effectivePrice - b.effectivePrice
          );
          setOffers(sorted);
        }
      } catch (err) {
        console.error('Error fetching offers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOffers();
  }, [selectedProduct]);

  // Open Card Specific Log Modal (Only searched product log)
  const handleOpenProductLog = (offer: any) => {
    setLogCompanyOffer(offer);
    setShowLogModal(true);
  };

  // Open Overall Log Modal (Complete overall vendor history)
  const handleOpenOverallLog = async () => {
    setShowOverallLogModal(true);
    try {
      setLoadingOverallLogs(true);
      const res = await fetch('/api/suppliers');
      const json = await res.json();
      if (json.success) {
        // Flatten all product quotations across all suppliers
        const allQuotationLogs: any[] = [];
        json.data.forEach((s: any) => {
          if (s.products && s.products.length > 0) {
            s.products.forEach((sp: any) => {
              allQuotationLogs.push({
                supplierName: s.companyName,
                gstNumber: s.gstNumber,
                phone: s.phone,
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
              });
            });
          }
        });
        setOverallLogs(allQuotationLogs);
      }
    } catch (err) {
      console.error('Error fetching overall logs:', err);
    } finally {
      setLoadingOverallLogs(false);
    }
  };

  const handleOrder = async () => {
    if (!selectedOffer || !selectedProduct) return;
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedOffer.supplier.id,
          createdById: 'manager-id',
          items: [
            {
              productId: selectedProduct.id,
              quantity,
              unitPrice: selectedOffer.basePrice,
              gstPercentage: selectedOffer.gstPercentage,
            },
          ],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setOrderSuccessMsg(`Order ${json.data.poNumber} placed! Total: ₹${json.data.totalAmount.toLocaleString('en-IN')}`);
        setTimeout(() => {
          setShowPOModal(false);
          setOrderSuccessMsg(null);
        }, 2000);
      }
    } catch (err) {
      console.error('Error creating order:', err);
    }
  };

  // Filter overall logs
  const filteredOverallLogs = useMemo(() => {
    if (!overallLogSearch.trim()) return overallLogs;
    const term = overallLogSearch.toLowerCase();
    return overallLogs.filter(
      (log) =>
        log.supplierName.toLowerCase().includes(term) ||
        log.productName.toLowerCase().includes(term) ||
        log.invoiceNo.toLowerCase().includes(term) ||
        log.brand.toLowerCase().includes(term) ||
        log.hsn.toLowerCase().includes(term)
    );
  }, [overallLogs, overallLogSearch]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Clean Header with Overall Log Menu Button */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <span>⚡ ProcureAI • Category Filter & Price Finder</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Select Category & Material
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm">
            Compare prices ranked <strong>Lowest to Highest</strong> for your selected item.
          </p>
        </div>

        {/* OVERALL LOG MENU BUTTON */}
        <button
          onClick={handleOpenOverallLog}
          className="px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-extrabold text-xs sm:text-sm transition flex items-center space-x-2 shrink-0 shadow-md"
        >
          <FileSpreadsheet className="h-4.5 w-4.5 text-blue-400" />
          <span>Overall Log Menu</span>
        </button>
      </div>

      {/* 1. Category Dropdown & Search Bar Container */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        {/* Category Dropdown Select */}
        <div className="relative w-full sm:w-64 shrink-0">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none">
            <Filter className="h-4 w-4" />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs sm:text-sm rounded-xl pl-10 pr-8 py-2.5 appearance-none focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
          >
            <option value="ALL">All Categories ({uniqueCategories.length})</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
            ▼
          </div>
        </div>

        {/* Text Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items within selected category..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* 2. Filtered Product Buttons */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Step 1: Select Product ({filteredProducts.length} items available)
          </span>
          {selectedCategory !== 'ALL' && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
              Category: {selectedCategory}
            </span>
          )}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 max-h-56 overflow-y-auto p-1">
            {filteredProducts.map((p) => {
              const isSelected = selectedProduct?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-500/20 scale-105'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                  }`}
                >
                  <Zap className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
            No products match category "{selectedCategory}".
          </div>
        )}
      </div>

      {/* 3. Company Price List (Low to High) */}
      {selectedProduct && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1 border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs text-slate-500">Step 2: Compare Prices for</span>
              <h2 className="text-xl font-extrabold text-slate-900">{selectedProduct.name}</h2>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Ranked: Lowest ➔ Highest Price
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
              Loading prices for {selectedProduct.name}...
            </div>
          ) : offers.length > 0 ? (
            <div className="space-y-3">
              {offers.map((offer, index) => {
                const isCheapest = index === 0;
                return (
                  <div
                    key={offer.id}
                    className={`rounded-2xl p-5 border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isCheapest
                        ? 'bg-blue-50/90 border-blue-600 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    {/* Left Info */}
                    <div className="flex items-start space-x-3.5">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs ${
                          isCheapest
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isCheapest ? <Trophy className="h-4.5 w-4.5" /> : `#${index + 1}`}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-extrabold text-slate-900 text-base">
                            {offer.supplier.companyName}
                          </h3>
                          {isCheapest && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-600 text-white uppercase tracking-wider">
                              Lowest Price
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                            GST: <strong className="text-slate-700">{offer.supplier.gstNumber}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="h-3.5 w-3.5 text-slate-500" />
                            Dispatch: <strong className="text-slate-700">{offer.leadTime} Days</strong>
                          </span>
                          <span className="flex items-center gap-1 text-amber-600 font-bold">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {offer.supplier.rating} / 5.0
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Price & Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      <div className="text-left sm:text-right pr-2">
                        <span className="text-[10px] text-slate-500 block font-semibold uppercase">
                          Final Price (incl. {offer.gstPercentage}% GST)
                        </span>
                        <div className="text-2xl font-black text-blue-600">
                          ₹{offer.effectivePrice.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[11px] text-slate-500 block">
                          Base: ₹{offer.basePrice.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Card Specific View Log Button (Filtered to Searched Product ONLY) */}
                      <button
                        onClick={() => handleOpenProductLog(offer)}
                        className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition flex items-center space-x-1.5 shrink-0 shadow-sm"
                        title="View log for this specific product only"
                      >
                        <History className="h-4 w-4 text-blue-600" />
                        <span>View Log</span>
                      </button>

                      {/* Order Now Button */}
                      <button
                        onClick={() => {
                          setSelectedOffer(offer);
                          setQuantity(offer.minimumOrderQuantity || 10);
                          setShowPOModal(true);
                        }}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center space-x-1.5 shrink-0 ${
                          isCheapest
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        <ShoppingBag className="h-4 w-4" />
                        <span>Order Now</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
              No prices listed for this item yet.
            </div>
          )}
        </div>
      )}

      {/* 📜 CARD SPECIFIC VIEW LOG MODAL (Shows ONLY the searched product log!) */}
      {showLogModal && logCompanyOffer && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full space-y-5 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setShowLogModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3 border-b border-slate-200 pb-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {logCompanyOffer.supplier.companyName}
                </h3>
                <p className="text-xs text-blue-600 font-bold">
                  Product Audit Log: <strong className="text-slate-900">{selectedProduct.name}</strong>
                </p>
              </div>
            </div>

            {/* Product Specific Audit Table */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-semibold text-[11px]">Vendor GSTIN</span>
                <p className="font-mono font-bold text-blue-600 text-xs">{logCompanyOffer.supplier.gstNumber}</p>
                <p className="text-slate-600 text-[11px] mt-1">{logCompanyOffer.supplier.address}</p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[11px]">
                      <th className="py-2.5 px-3">Invoice No</th>
                      <th className="py-2.5 px-3">HSN No</th>
                      <th className="py-2.5 px-3">Specification</th>
                      <th className="py-2.5 px-3">Make</th>
                      <th className="py-2.5 px-3">Unit Rate</th>
                      <th className="py-2.5 px-3 text-blue-600">With GST</th>
                      <th className="py-2.5 px-3 text-emerald-700">Discount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-slate-50 text-[11px]">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {logCompanyOffer.invoiceNo || 'FSCH/00139/25-26'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {selectedProduct.hsn || '8541'}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {selectedProduct.specification}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {selectedProduct.brand}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        ₹{logCompanyOffer.basePrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-black text-blue-600">
                        ₹{logCompanyOffer.effectivePrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-600">
                        {logCompanyOffer.discount || '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] flex items-center justify-between font-semibold">
                <span>Quotation Validity</span>
                <span>Active • Guaranteed Price</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📊 OVERALL LOG MENU MODAL (Displays complete company-wide logs & all invoices) */}
      {showOverallLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-4xl w-full space-y-4 shadow-2xl relative text-slate-900 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowOverallLogModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-xl">
                    Overall Company Audit Log
                  </h3>
                  <p className="text-xs text-slate-500">
                    Complete invoice, quotation & pricing history across all suppliers & materials ({overallLogs.length} Records)
                  </p>
                </div>
              </div>

              {/* Search within overall log */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={overallLogSearch}
                  onChange={(e) => setOverallLogSearch(e.target.value)}
                  placeholder="Filter invoice, vendor, HSN..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {loadingOverallLogs ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                Loading complete company logs from database...
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm max-h-[60vh]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[11px] z-10">
                      <tr>
                        <th className="py-3 px-3">Vendor / Company</th>
                        <th className="py-3 px-3">Invoice No</th>
                        <th className="py-3 px-3">HSN No</th>
                        <th className="py-3 px-3">Product Name</th>
                        <th className="py-3 px-3">Specification</th>
                        <th className="py-3 px-3">Make</th>
                        <th className="py-3 px-3">Unit Rate</th>
                        <th className="py-3 px-3">GST %</th>
                        <th className="py-3 px-3 text-blue-600">With GST</th>
                        <th className="py-3 px-3 text-emerald-700">Discount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px]">
                      {filteredOverallLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-extrabold text-slate-900">
                            {log.supplierName}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                            {log.invoiceNo}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {log.hsn}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {log.productName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {log.specification}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {log.brand}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            ₹{log.basePrice.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {log.gstPercentage}%
                          </td>
                          <td className="py-2.5 px-3 font-black text-blue-600">
                            ₹{log.effectivePrice.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-emerald-600">
                            {log.discount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simple Order Modal */}
      {showPOModal && selectedOffer && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl relative text-slate-900">
            <button
              onClick={() => setShowPOModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-200 pb-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Place Purchase Order</h3>
                <p className="text-xs text-slate-500">{selectedOffer.supplier.companyName}</p>
              </div>
            </div>

            {orderSuccessMsg ? (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold text-center flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-blue-600 animate-bounce" />
                <span>{orderSuccessMsg}</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Item Selected</span>
                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedProduct.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-slate-500">Unit Price (incl. GST)</span>
                    <p className="font-extrabold text-blue-600 text-sm">₹{selectedOffer.effectivePrice.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Delivery Time</span>
                    <p className="font-bold text-slate-800">{selectedOffer.leadTime} Days</p>
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Order Quantity ({selectedProduct.unit})
                  </label>
                  <input
                    type="number"
                    min={selectedOffer.minimumOrderQuantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Min Quantity: {selectedOffer.minimumOrderQuantity} {selectedProduct.unit}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700">Total Price</span>
                  <span className="font-black text-blue-600 text-base">
                    ₹{(selectedOffer.effectivePrice * quantity).toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={handleOrder}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-extrabold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition"
                >
                  Confirm Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
