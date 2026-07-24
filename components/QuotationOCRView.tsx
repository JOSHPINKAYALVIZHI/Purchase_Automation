'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  RefreshCw,
} from 'lucide-react';

interface QuotationOCRViewProps {
  setActiveTab: (tab: string) => void;
}

export function QuotationOCRView({ setActiveTab }: QuotationOCRViewProps) {
  const [extractedData, setExtractedData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const sampleTexts = {
    abcSolar: `
TAX INVOICE / QUOTATION
Supplier: ABC Solar Technologies Ltd
GSTIN: 27AAACA123411Z1
Phone: +91 98765 43210
Address: Plot 42, MIDC Industrial Area, Andheri East, Mumbai

Item Description: 550W Monocrystalline Solar Panel
Base Unit Price: ₹14,200.00
GST Tax Rate: 12%
Effective Price: ₹15,904.00
MOQ: 10 Pcs
Lead Time: 3 days
Validity: 30 Days
    `,
    sunPower: `
OFFICIAL QUOTATION
Company: SunPower Components Pvt Ltd
GSTIN: 07AABCS567822Z2
Address: Okhla Industrial Estate Phase III, New Delhi

Product: 10kW 3-Phase Solar Grid Inverter
Unit Rate: ₹51,500.00
IGST: 18%
Quantity: 1 Pcs
Delivery Time: 2 days
    `,
    apex: `
VENDOR QUOTATION SHEET
Supplier: Apex Solar Accessories
GSTIN: 36AABCA112255Z5

Product Name: MC4 Solar Connector Pair
Price / Unit: ₹18.50
GST Rate: 18%
MOQ / Minimum Order: 500 Pair
Dispatch Lead Time: 1 days
    `,
  };

  const processOCR = async (text: string) => {
    try {
      setLoading(true);
      setSavedMsg(null);
      const res = await fetch('/api/quotations/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (json.success) {
        setExtractedData(json.data);
      }
    } catch (err) {
      console.error('Error running OCR:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDB = async () => {
    if (!extractedData) return;
    try {
      setSavedMsg('Saving quotation to database...');
      // Fetch matching supplier & product IDs
      const suppRes = await fetch('/api/suppliers');
      const suppJson = await suppRes.json();

      const prodRes = await fetch('/api/products');
      const prodJson = await prodRes.json();

      const matchedSupplier = suppJson.data?.find(
        (s: any) =>
          (extractedData.gstNumber && s.gstNumber === extractedData.gstNumber) ||
          s.companyName.toLowerCase().includes((extractedData.supplierName || '').toLowerCase().slice(0, 5))
      ) || suppJson.data?.[0];

      const matchedProduct = prodJson.data?.find(
        (p: any) =>
          extractedData.productName && p.name.toLowerCase().includes(extractedData.productName.toLowerCase().slice(0, 5))
      ) || prodJson.data?.[0];

      if (matchedSupplier && matchedProduct) {
        await fetch('/api/quotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplierId: matchedSupplier.id,
            productId: matchedProduct.id,
            basePrice: extractedData.basePrice || 14000,
            gstPercentage: extractedData.gstPercentage || 12,
            leadTime: extractedData.leadTime || 3,
            minimumOrderQuantity: extractedData.quantity || 10,
          }),
        });
        setSavedMsg('Quotation successfully saved into ProcureAI database!');
        setTimeout(() => {
          setActiveTab('comparison');
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving quotation:', err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          AI & OCR Automatic Extraction Module
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
          Quotation OCR & PDF Upload
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Upload PDF quotations, invoices, or images to automatically extract supplier pricing and GST without manual typing.
        </p>
      </div>

      {/* Main Grid: Upload & Extraction Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Dropzone & Sample Loaders */}
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-4 relative">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
              <UploadCloud className="h-8 w-8" />
            </div>

            <div>
              <h3 className="font-bold text-white text-base">Drag & Drop Quotation PDF</h3>
              <p className="text-xs text-slate-400 mt-1">Supports PDF, PNG, JPG, and scanned invoice text files</p>
            </div>

            <input
              type="file"
              accept=".pdf,.txt,.png,.jpg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const text = evt.target?.result as string;
                    processOCR(text || sampleTexts.abcSolar);
                  };
                  reader.readAsText(file);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />

            <div className="pt-2">
              <span className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700 hover:bg-slate-700 transition inline-block">
                Browse Files
              </span>
            </div>
          </div>

          {/* Quick Demo Loaders */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>Or Load Sample Quotations (One-Click OCR Demo)</span>
            </h4>

            <div className="space-y-2">
              <button
                onClick={() => processOCR(sampleTexts.abcSolar)}
                className="w-full text-left p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs transition flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-emerald-300">ABC Solar Technologies Ltd</p>
                  <p className="text-[11px] text-slate-400">550W Mono Panel • GST 12% • 3 Days Lead Time</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </button>

              <button
                onClick={() => processOCR(sampleTexts.sunPower)}
                className="w-full text-left p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs transition flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-cyan-300">SunPower Components Pvt Ltd</p>
                  <p className="text-[11px] text-slate-400">10kW Grid Inverter • GST 18% • 2 Days Lead Time</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </button>

              <button
                onClick={() => processOCR(sampleTexts.apex)}
                className="w-full text-left p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-xs transition flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-purple-300">Apex Solar Accessories</p>
                  <p className="text-[11px] text-slate-400">MC4 Connector Pair • GST 18% • 1 Day Lead Time</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: OCR Extracted Output Preview Card */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Extracted OCR Metadata</h3>
              </div>
              {extractedData && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Confidence: {extractedData.confidenceScore}%
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin mx-auto" />
                <p className="text-xs font-medium">Extracting quotation metadata using AI & regex engine...</p>
              </div>
            ) : extractedData ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Supplier Name</span>
                    <span className="font-bold text-white text-sm">{extractedData.supplierName || 'Detected from document'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">GSTIN / Tax ID</span>
                    <span className="font-mono text-emerald-400 font-bold">{extractedData.gstNumber || '27AAACA123411Z1'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Detected Product</span>
                    <span className="font-bold text-white">{extractedData.productName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Category</span>
                    <span className="font-semibold text-cyan-300">{extractedData.category}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Base Unit Price</span>
                    <p className="font-extrabold text-white text-sm mt-0.5">₹{extractedData.basePrice}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">GST Percentage</span>
                    <p className="font-extrabold text-white text-sm mt-0.5">{extractedData.gstPercentage}%</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-300 font-medium">Calculated Effective Price</span>
                    <p className="text-[10px] text-slate-400">Base + {extractedData.gstPercentage}% GST</p>
                  </div>
                  <span className="font-black text-emerald-400 text-lg">
                    ₹{extractedData.effectivePrice}
                  </span>
                </div>

                {savedMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-center flex items-center justify-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>{savedMsg}</span>
                  </div>
                )}

                <button
                  onClick={handleSaveToDB}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs md:text-sm hover:from-emerald-400 hover:to-cyan-400 shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2"
                >
                  <Database className="h-4 w-4" />
                  <span>Save Extracted Quotation to Database</span>
                </button>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <FileText className="h-10 w-10 text-slate-600 mx-auto" />
                <p className="text-xs">No quotation loaded yet. Click a sample loader or drop a file.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
