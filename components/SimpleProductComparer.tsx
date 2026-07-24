'use client';

import React, { useState, useEffect } from 'react';
import { Search, Zap, Trophy, ShieldCheck, ShoppingBag, Truck, Star, CheckCircle2, X } from 'lucide-react';

export function SimpleProductComparer() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // PO Modal State
  const [showPOModal, setShowPOModal] = useState<boolean>(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(10);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // Load products from database
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setProducts(json.data);
          setSelectedProduct(json.data[0]); // Default to first product (550W Panel)
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Fetch and sort company offers from Low Price to High Price
  useEffect(() => {
    if (!selectedProduct) return;
    async function loadOffers() {
      try {
        setLoading(true);
        const res = await fetch(`/api/quotations?productId=${selectedProduct.id}`);
        const json = await res.json();
        if (json.success) {
          // Sort strictly LOW PRICE to HIGH PRICE (effectivePrice ascending)
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

  // Filter products by search term
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
  );

  const handleOrder = async () => {
    if (!selectedOffer || !selectedProduct) return;
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedOffer.supplier.id,
          createdById: 'manager-user-id',
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
        setOrderSuccessMsg(`Purchase Order ${json.data.poNumber} created successfully! Total: ₹${json.data.totalAmount.toLocaleString('en-IN')}`);
        setTimeout(() => {
          setShowPOModal(false);
          setOrderSuccessMsg(null);
        }, 2000);
      }
    } catch (err) {
      console.error('Error creating order:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      {/* App Title Header */}
      <div className="text-center space-y-2 py-4">
        <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wide uppercase">
          ProcureAI • Low to High Price Finder
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Select Product to Compare Suppliers
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Choose any solar item below. All verified suppliers are listed automatically from <strong>Cheapest to Highest Price</strong>.
        </p>
      </div>

      {/* 1. Search Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products: e.g. 550W, MC4, Inverter, Cable..."
          className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition shadow-xl"
        />
      </div>

      {/* 2. Product Selection Pills */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block text-center">
          Step 1: Click a product to see suppliers
        </label>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {filteredProducts.map((p) => {
            const isSelected = selectedProduct?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/25 scale-105'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Zap className={`h-4 w-4 ${isSelected ? 'text-slate-950' : 'text-emerald-400'}`} />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Supplier Low-to-High Price List */}
      {selectedProduct && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between px-2 border-b border-slate-800/80 pb-3">
            <div>
              <span className="text-xs text-slate-400">Step 2: Compare Prices for</span>
              <h2 className="text-xl font-extrabold text-white">{selectedProduct.name}</h2>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Sorted: Low Price ➔ High Price
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Finding best prices for {selectedProduct.name}...
            </div>
          ) : offers.length > 0 ? (
            <div className="space-y-3">
              {offers.map((offer, index) => {
                const isCheapest = index === 0;
                return (
                  <div
                    key={offer.id}
                    className={`glass-panel rounded-2xl p-5 border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isCheapest
                        ? 'border-emerald-500/50 bg-emerald-500/5 glow-emerald shadow-xl'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                    }`}
                  >
                    {/* Left Info */}
                    <div className="flex items-start space-x-4">
                      {/* Rank Badge */}
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${
                          isCheapest
                            ? 'bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isCheapest ? <Trophy className="h-5 w-5" /> : `#${index + 1}`}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-white text-base md:text-lg">
                            {offer.supplier.companyName}
                          </h3>
                          {isCheapest && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                              🏆 Lowest Price
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                            GST: <strong className="text-slate-300">{offer.supplier.gstNumber}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="h-3.5 w-3.5 text-cyan-400" />
                            Dispatch: <strong className="text-slate-300">{offer.leadTime} Days</strong>
                          </span>
                          <span className="flex items-center gap-1 text-purple-300 font-bold">
                            <Star className="h-3.5 w-3.5 fill-purple-400 text-purple-400" />
                            {offer.supplier.rating} / 5.0
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Price & Order Action */}
                    <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                          Final Price (incl. {offer.gstPercentage}% GST)
                        </span>
                        <div className="text-2xl font-black text-emerald-400">
                          ₹{offer.effectivePrice.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[11px] text-slate-500 block">
                          Base: ₹{offer.basePrice.toLocaleString('en-IN')} | MOQ: {offer.minimumOrderQuantity} {selectedProduct.unit}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedOffer(offer);
                          setQuantity(offer.minimumOrderQuantity || 10);
                          setShowPOModal(true);
                        }}
                        className={`px-5 py-3 rounded-xl font-bold text-xs md:text-sm transition flex items-center space-x-2 shrink-0 ${
                          isCheapest
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/25 scale-105'
                            : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
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
            <div className="py-12 text-center text-slate-500 text-sm glass-panel rounded-2xl border border-slate-800">
              No supplier offers found for this product.
            </div>
          )}
        </div>
      )}

      {/* Quick Order / PO Modal */}
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
                <h3 className="font-bold text-white text-base">Place Order / Create PO</h3>
                <p className="text-xs text-slate-400">Supplier: {selectedOffer.supplier.companyName}</p>
              </div>
            </div>

            {orderSuccessMsg ? (
              <div className="p-5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center flex flex-col items-center gap-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 animate-bounce" />
                <span>{orderSuccessMsg}</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Item</span>
                  <p className="font-bold text-white">{selectedProduct.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <span className="text-slate-400">Price Per Unit (GST incl.)</span>
                    <p className="font-extrabold text-emerald-400 text-sm">₹{selectedOffer.effectivePrice.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Delivery Lead Time</span>
                    <p className="font-bold text-slate-200">{selectedOffer.leadTime} Days</p>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Enter Quantity ({selectedProduct.unit})
                  </label>
                  <input
                    type="number"
                    min={selectedOffer.minimumOrderQuantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Minimum Order: {selectedOffer.minimumOrderQuantity} {selectedProduct.unit}</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-300">Total Purchase Amount</span>
                  <span className="font-black text-emerald-400 text-lg">
                    ₹{(selectedOffer.effectivePrice * quantity).toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={handleOrder}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-extrabold text-sm hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20 transition"
                >
                  Confirm Purchase Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
