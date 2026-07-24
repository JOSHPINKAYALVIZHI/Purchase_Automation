'use client';

import React, { useState, useEffect } from 'react';
import { Package, ShieldAlert, CheckCircle2, ArrowUpDown, Plus, Minus, Warehouse } from 'lucide-react';

export function InventoryView() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadInventory() {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        const json = await res.json();
        if (json.success) {
          const items = json.data.map((p: any) => ({
            productId: p.id,
            productName: p.name,
            category: p.category,
            brand: p.brand,
            unit: p.unit,
            minimumStock: p.minimumStock,
            stock: p.inventory?.stock ?? 50,
            reserved: p.inventory?.reserved ?? 5,
            available: p.inventory?.available ?? 45,
            warehouse: p.inventory?.warehouse || 'Main Solar Warehouse',
            isLow: (p.inventory?.stock ?? 50) < p.minimumStock,
          }));
          setInventory(items);
        }
      } catch (err) {
        console.error('Error loading inventory:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInventory();
  }, []);

  const handleAdjustStock = (productId: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const newStock = Math.max(0, item.stock + delta);
          const newAvail = Math.max(0, newStock - item.reserved);
          return {
            ...item,
            stock: newStock,
            available: newAvail,
            isLow: newStock < item.minimumStock,
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          Warehouse & Reorder Level Tracking
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
          Inventory & Reorder Alert Monitor
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Monitor current stock, reserved allocations, and automated low-stock reorder thresholds.
        </p>
      </div>

      {/* Inventory Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Warehouse className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Main Solar Warehouse Inventory</h3>
          </div>
          <span className="text-xs text-slate-400">Total Tracked Items: {inventory.length}</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading inventory records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 bg-slate-900/60">
                  <th className="py-3.5 px-4 font-semibold">Product Name</th>
                  <th className="py-3.5 px-3 font-semibold">Category</th>
                  <th className="py-3.5 px-3 font-semibold">Current Stock</th>
                  <th className="py-3.5 px-3 font-semibold">Reserved</th>
                  <th className="py-3.5 px-3 font-semibold text-emerald-400">Available</th>
                  <th className="py-3.5 px-3 font-semibold">Min Stock Level</th>
                  <th className="py-3.5 px-3 font-semibold">Stock Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Adjust Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inventory.map((item) => (
                  <tr key={item.productId} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-bold text-slate-100">{item.productName}</td>
                    <td className="py-4 px-3 text-slate-400">{item.category}</td>
                    <td className="py-4 px-3 font-extrabold text-white text-sm">{item.stock} {item.unit}</td>
                    <td className="py-4 px-3 text-slate-400">{item.reserved} {item.unit}</td>
                    <td className="py-4 px-3 font-bold text-emerald-400">{item.available} {item.unit}</td>
                    <td className="py-4 px-3 text-slate-400">{item.minimumStock} {item.unit}</td>
                    <td className="py-4 px-3">
                      {item.isLow ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full">
                          <ShieldAlert className="h-3 w-3 mr-1 text-amber-400" />
                          REORDER ALERT
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-400" />
                          IN STOCK
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1">
                        <button
                          onClick={() => handleAdjustStock(item.productId, -5)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs font-bold text-slate-200 px-1">±5</span>
                        <button
                          onClick={() => handleAdjustStock(item.productId, 5)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
