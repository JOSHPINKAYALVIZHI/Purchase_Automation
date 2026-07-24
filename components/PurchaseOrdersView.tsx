'use client';

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Clock, Truck, Download, AlertCircle, RefreshCw } from 'lucide-react';

export function PurchaseOrdersView() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/purchase-orders');
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error('Error fetching POs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (poId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PENDING' ? 'APPROVED' : currentStatus === 'APPROVED' ? 'DELIVERED' : 'APPROVED';
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: poId, status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        if (nextStatus === 'DELIVERED') {
          setSyncMsg(`PO ${json.data.poNumber} marked as DELIVERED! Inventory stock automatically synchronized.`);
          setTimeout(() => setSyncMsg(null), 3000);
        }
        fetchOrders();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Purchase Order Lifecycle & Workflow
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
          Purchase Orders & Approvals
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Generate, approve, and track purchase orders with real-time supplier and inventory synchronization.
        </p>
      </div>

      {syncMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-500/10">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-emerald-400" />
            <span>{syncMsg}</span>
          </div>
        </div>
      )}

      {/* PO Table Card */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Generated Purchase Orders</h3>
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading purchase orders...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 bg-slate-900/60">
                  <th className="py-3.5 px-4 font-semibold">PO Number</th>
                  <th className="py-3.5 px-3 font-semibold">Supplier</th>
                  <th className="py-3.5 px-3 font-semibold">Order Date</th>
                  <th className="py-3.5 px-3 font-semibold">Items Breakdown</th>
                  <th className="py-3.5 px-3 font-semibold text-emerald-400">Total PO Value</th>
                  <th className="py-3.5 px-3 font-semibold">Status Workflow</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Download PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-extrabold text-emerald-300">{po.poNumber}</td>
                    <td className="py-4 px-3 font-bold text-slate-100">{po.supplier.companyName}</td>
                    <td className="py-4 px-3 text-slate-400">
                      {new Date(po.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-3 text-slate-300">
                      {po.items.map((it: any) => `${it.product.name} (${it.quantity} ${it.product.unit})`).join(', ')}
                    </td>
                    <td className="py-4 px-3 font-extrabold text-white text-sm">
                      ₹{po.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-3">
                      <button
                        onClick={() => handleUpdateStatus(po.id, po.status)}
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold transition hover:scale-105 ${
                          po.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : po.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {po.status === 'APPROVED' ? (
                          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-400" />
                        ) : po.status === 'PENDING' ? (
                          <Clock className="h-3 w-3 mr-1 text-amber-400" />
                        ) : (
                          <Truck className="h-3 w-3 mr-1 text-cyan-400" />
                        )}
                        <span>{po.status} (Click to toggle)</span>
                      </button>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => alert(`Downloading official PDF for ${po.poNumber}...`)}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-slate-700 transition inline-flex items-center space-x-1"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-semibold">PDF</span>
                      </button>
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
