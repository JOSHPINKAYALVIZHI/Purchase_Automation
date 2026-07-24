'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Check,
  Star,
  Zap,
  Truck,
  Sparkles,
  ShieldCheck,
  ArrowUpDown,
  ShoppingBag,
  Info,
  X,
  CheckCircle2,
} from 'lucide-react';

interface SupplierComparisonViewProps {
  setActiveTab: (tab: string) => void;
}

export function SupplierComparisonView({ setActiveTab }: SupplierComparisonViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('550W');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // PO Creation Modal state
  const [showPOModal, setShowPOModal] = useState<boolean>(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [poQuantity, setPoQuantity] = useState<number>(10);
  const [poCreatedMsg, setPoCreatedMsg] = useState<string | null>(null);

  // Fetch products
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`);
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setProducts(json.data);
          setSelectedProduct(json.data[0]);
        }
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [searchQuery]);

  // Fetch comparison data for selected product
  useEffect(() => {
    if (!selectedProduct) return;
    async function loadComparison() {
      try {
        const res = await fetch(`/api/quotations?productId=${selectedProduct.id}`);
        const json = await res.json();
        if (json.success) {
          setComparisonData(json.data);
        }
      } catch (err) {
        console.error('Error loading comparison:', err);
      }
    }
    loadComparison();
  }, [selectedProduct]);

  const categories = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'Solar Panel', label: 'Solar Panels' },
    { id: 'Connectors', label: 'Connectors' },
    { id: 'Cables', label: 'Cables' },
    { id: 'Inverter', label: 'Inverters' },
  ];

  const handleCreatePO = async () => {
    if (!selectedOffer || !selectedProduct) return;
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedOffer.supplier.id,
          createdById: 'rajesh-user-id', // Manager ID
          items: [
            {
              productId: selectedProduct.id,
              quantity: poQuantity,
              unitPrice: selectedOffer.basePrice,
              gstPercentage: selectedOffer.gstPercentage,
            },
          ],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPoCreatedMsg(`Purchase Order ${json.data.poNumber} created successfully! Total: ₹${json.data.totalAmount.toLocaleString('en-IN')}`);
        setTimeout(() => {
          setShowPOModal(false);
          setPoCreatedMsg(null);
          setActiveTab('purchase-orders');
        }, 1800);
      }
    } catch (err) {
      console.error('Error creating PO:', err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Flipkart-Style Multi-Supplier Matrix
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            Supplier Price & Lead Time Comparison
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Compare GST-inclusive effective prices, ratings, and delivery times to choose the optimal supplier.
          </p>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search MC4, 550W, Inverter..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs md:text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Selection Chips */}
      {products.length > 0 && (
        <div className="flex items-center space-x-3 overflow-x-auto pb-2">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition border flex items-center space-x-2 shrink-0 ${
                selectedProduct?.id === p.id
                  ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Zap className={`h-3.5 w-3.5 ${selectedProduct?.id === p.id ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Comparison Matrix Card */}
      {selectedProduct && comparisonData ? (
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-6">
          {/* Selected Product Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {selectedProduct.category}
                </span>
                <span className="text-xs text-slate-400">Brand: <strong>{selectedProduct.brand}</strong></span>
                <span className="text-xs text-slate-400">HSN: <strong>{selectedProduct.hsn}</strong></span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1">{selectedProduct.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedProduct.specification}</p>
            </div>

            <div className="flex items-center space-x-3 text-xs bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
              <Info className="h-4 w-4 text-cyan-400 shrink-0" />
              <span className="text-slate-300">
                Found <strong>{comparisonData.quotations.length} verified supplier offers</strong>
              </span>
            </div>
          </div>

          {/* Highlights Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisonData.highlights.lowestPrice && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">Best Price Offer</p>
                  <p className="text-sm font-extrabold text-white">{comparisonData.highlights.lowestPrice.supplier.companyName}</p>
                  <p className="text-xs text-emerald-400 font-bold">₹{comparisonData.highlights.lowestPrice.effectivePrice} (incl. GST)</p>
                </div>
              </div>
            )}

            {comparisonData.highlights.fastestDelivery && (
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] text-cyan-300 font-bold uppercase tracking-wider">Fastest Delivery</p>
                  <p className="text-sm font-extrabold text-white">{comparisonData.highlights.fastestDelivery.supplier.companyName}</p>
                  <p className="text-xs text-cyan-400 font-bold">{comparisonData.highlights.fastestDelivery.leadTime} Days Dispatch</p>
                </div>
              </div>
            )}

            {comparisonData.highlights.highestRated && (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] text-purple-300 font-bold uppercase tracking-wider">Highest Rated</p>
                  <p className="text-sm font-extrabold text-white">{comparisonData.highlights.highestRated.supplier.companyName}</p>
                  <p className="text-xs text-purple-400 font-bold">⭐ {comparisonData.highlights.highestRated.supplier.rating} / 5.0</p>
                </div>
              </div>
            )}
          </div>

          {/* Flipkart-style Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 bg-slate-900/60">
                  <th className="py-3.5 px-4 font-semibold">Supplier Name</th>
                  <th className="py-3.5 px-3 font-semibold">Base Price</th>
                  <th className="py-3.5 px-3 font-semibold">GST %</th>
                  <th className="py-3.5 px-3 font-semibold text-emerald-400">Effective Price</th>
                  <th className="py-3.5 px-3 font-semibold">Lead Time</th>
                  <th className="py-3.5 px-3 font-semibold">MOQ</th>
                  <th className="py-3.5 px-3 font-semibold">Vendor Rating</th>
                  <th className="py-3.5 px-3 font-semibold">Badges</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {comparisonData.quotations.map((q: any) => {
                  const isLowest = q.effectivePrice === comparisonData.highlights.lowestPrice?.effectivePrice;
                  return (
                    <tr
                      key={q.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isLowest ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <td className="py-4 px-4 font-bold text-slate-100 flex items-center space-x-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{q.supplier.companyName}</span>
                      </td>
                      <td className="py-4 px-3 text-slate-300 font-medium">₹{q.basePrice.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-3 text-slate-400">{q.gstPercentage}%</td>
                      <td className="py-4 px-3 font-extrabold text-emerald-400 text-sm">
                        ₹{q.effectivePrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-3 text-slate-200 font-semibold">{q.leadTime} Days</td>
                      <td className="py-4 px-3 text-slate-400">{q.minimumOrderQuantity} {selectedProduct.unit}</td>
                      <td className="py-4 px-3 font-bold text-purple-300">⭐ {q.supplier.rating}</td>
                      <td className="py-4 px-3">
                        <div className="flex flex-wrap gap-1">
                          {isLowest && (
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              Best Price
                            </span>
                          )}
                          {q.leadTime === comparisonData.highlights.fastestDelivery?.leadTime && (
                            <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                              Fastest
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedOffer(q);
                            setPoQuantity(q.minimumOrderQuantity || 10);
                            setShowPOModal(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-emerald-500 shadow-md shadow-emerald-500/20 transition inline-flex items-center space-x-1"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>Generate PO</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl border border-slate-800">
          Loading comparison data...
        </div>
      )}

      {/* PO Creation Modal */}
      {showPOModal && selectedOffer && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-[#0D131F] border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowPOModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Generate Purchase Order</h3>
                <p className="text-xs text-slate-400">PO-2026-00127 Draft</p>
              </div>
            </div>

            {poCreatedMsg ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 animate-bounce" />
                <span>{poCreatedMsg}</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400">Selected Supplier</span>
                  <p className="font-bold text-white text-sm mt-0.5">{selectedOffer.supplier.companyName}</p>
                </div>

                <div>
                  <span className="text-slate-400">Product Specification</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{selectedProduct.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <span className="text-slate-400">Base Unit Rate</span>
                    <p className="font-bold text-slate-200">₹{selectedOffer.basePrice}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">GST Percentage</span>
                    <p className="font-bold text-slate-200">{selectedOffer.gstPercentage}%</p>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Order Quantity ({selectedProduct.unit})</label>
                  <input
                    type="number"
                    min={selectedOffer.minimumOrderQuantity}
                    value={poQuantity}
                    onChange={(e) => setPoQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Minimum Order Quantity: {selectedOffer.minimumOrderQuantity} {selectedProduct.unit}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-300">Total Calculated PO Amount</span>
                  <span className="font-extrabold text-emerald-400 text-base">
                    ₹{(selectedOffer.effectivePrice * poQuantity).toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={handleCreatePO}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-bold text-sm hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20 transition"
                >
                  Confirm & Dispatch PO
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
