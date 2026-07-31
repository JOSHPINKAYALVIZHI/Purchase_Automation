'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  PackageCheck,
  Users,
  DollarSign,
  PieChart,
  Award,
  Sparkles,
  Receipt,
  Building2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  X,
  CalendarDays,
  Tag,
  LineChart as LineChartIcon,
} from 'lucide-react';

export function AnalysisView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Calendar & Filter State
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(2026, 6, 1)); // July 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [selectedMonthStr, setSelectedMonthStr] = useState<string | null>(null);
  const [showDateModal, setShowDateModal] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/suppliers');
        const json = await res.json();
        if (json.success) {
          const items: any[] = [];

          // Distributed months across 2026 (Jan to Jul)
          const monthsList = [
            '2026-01-15',
            '2026-02-14',
            '2026-03-20',
            '2026-04-18',
            '2026-05-22',
            '2026-06-25',
            '2026-07-05',
            '2026-07-15',
            '2026-07-24',
            '2026-07-31',
          ];

          let idx = 0;
          json.data.forEach((s: any) => {
            if (s.products) {
              s.products.forEach((sp: any) => {
                const base = sp.basePrice || 0;
                const gstRate = sp.gstPercentage || 18;
                const gstAmt = (base * gstRate) / 100;
                const effective = sp.effectivePrice || base + gstAmt;

                // Format ISO date
                const dateIsoStr = monthsList[idx % monthsList.length];
                const monthKey = dateIsoStr.substring(0, 7); // e.g. "2026-07"

                items.push({
                  id: sp.id,
                  supplierName: s.companyName,
                  category: sp.product?.category || 'Solar Equipment',
                  productName: sp.product?.name || 'Solar Item',
                  brand: sp.product?.brand || 'Standard Make',
                  invoiceNo: sp.invoiceNo || 'FSCH/00139/25-26',
                  basePrice: base,
                  gstPercentage: gstRate,
                  gstAmount: gstAmt,
                  effectivePrice: effective,
                  totalAmount: effective,
                  dateStr: dateIsoStr,
                  monthStr: monthKey,
                });
                idx++;
              });
            }
          });
          setLogs(items);
        }
      } catch (err) {
        console.error('Error loading analysis data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter logs if a specific date or month is selected
  const activeLogs = useMemo(() => {
    if (selectedDateStr) {
      return logs.filter((l) => l.dateStr === selectedDateStr);
    }
    if (selectedMonthStr) {
      return logs.filter((l) => l.monthStr === selectedMonthStr);
    }
    return logs;
  }, [logs, selectedDateStr, selectedMonthStr]);

  // Overall Totals
  const totals = useMemo(() => {
    const totalGrand = activeLogs.reduce((acc, curr) => acc + curr.effectivePrice, 0);
    const totalBase = activeLogs.reduce((acc, curr) => acc + curr.basePrice, 0);
    const totalGst = activeLogs.reduce((acc, curr) => acc + curr.gstAmount, 0);
    return {
      grandTotal: totalGrand,
      baseTotal: totalBase,
      gstTotal: totalGst,
      totalItems: activeLogs.length,
    };
  }, [activeLogs]);

  // Group Spend Month by Month (Jan to Jul 2026) for Line Graph
  const monthlyTrendData = useMemo(() => {
    const months = [
      { key: '2026-01', label: 'Jan' },
      { key: '2026-02', label: 'Feb' },
      { key: '2026-03', label: 'Mar' },
      { key: '2026-04', label: 'Apr' },
      { key: '2026-05', label: 'May' },
      { key: '2026-06', label: 'Jun' },
      { key: '2026-07', label: 'Jul' },
    ];

    const map: Record<string, { total: number; count: number }> = {};
    months.forEach((m) => {
      map[m.key] = { total: 0, count: 0 };
    });

    logs.forEach((l) => {
      if (map[l.monthStr]) {
        map[l.monthStr].total += l.effectivePrice;
        map[l.monthStr].count += 1;
      }
    });

    return months.map((m) => ({
      monthKey: m.key,
      label: m.label,
      total: map[m.key].total,
      count: map[m.key].count,
    }));
  }, [logs]);

  const maxMonthlyTotal = useMemo(() => {
    return Math.max(...monthlyTrendData.map((m) => m.total), 1);
  }, [monthlyTrendData]);

  // Group Spend by Date for Timeline Chart & Calendar Highlights
  const dateSpendMap = useMemo(() => {
    const map: Record<string, { total: number; count: number; items: any[] }> = {};
    logs.forEach((l) => {
      if (!map[l.dateStr]) {
        map[l.dateStr] = { total: 0, count: 0, items: [] };
      }
      map[l.dateStr].total += l.effectivePrice;
      map[l.dateStr].count += 1;
      map[l.dateStr].items.push(l);
    });
    return map;
  }, [logs]);

  // Sort Date Trend Array
  const dateTrendList = useMemo(() => {
    return Object.entries(dateSpendMap)
      .map(([dStr, data]) => ({
        dateStr: dStr,
        displayDate: new Date(dStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => (a.dateStr > b.dateStr ? 1 : -1));
  }, [dateSpendMap]);

  const maxDailySpend = useMemo(() => {
    return Math.max(...dateTrendList.map((d) => d.total), 1);
  }, [dateTrendList]);

  // Spend by Material Category
  const categorySpend = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    activeLogs.forEach((l) => {
      const cat = l.category || 'Solar Equipment';
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += l.effectivePrice;
      map[cat].count += 1;
    });

    const sorted = Object.entries(map).sort((a, b) => b[1].total - a[1].total);
    const maxTotal = sorted[0]?.[1].total || 1;

    return sorted.map(([cat, data]) => ({
      category: cat,
      amount: data.total,
      count: data.count,
      percentOfTotal: totals.grandTotal ? Math.round((data.total / totals.grandTotal) * 100) : 0,
      barWidth: Math.round((data.total / maxTotal) * 100),
    }));
  }, [activeLogs, totals.grandTotal]);

  // Calendar Grid Calculation
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{ dayNumber: number | null; dateStr: string | null; hasPurchase: boolean; totalAmount: number; itemCount: number }> = [];

    // Empty lead cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, dateStr: null, hasPurchase: false, totalAmount: 0, itemCount: 0 });
    }

    // Month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dayFormatted = String(d).padStart(2, '0');
      const monthFormatted = String(month + 1).padStart(2, '0');
      const dateStr = `${year}-${monthFormatted}-${dayFormatted}`;

      const spendData = dateSpendMap[dateStr];
      days.push({
        dayNumber: d,
        dateStr,
        hasPurchase: Boolean(spendData && spendData.count > 0),
        totalAmount: spendData ? spendData.total : 0,
        itemCount: spendData ? spendData.count : 0,
      });
    }

    return days;
  }, [currentMonthDate, dateSpendMap]);

  const handleDateClick = (dateStr: string | null) => {
    if (!dateStr) return;
    if (selectedDateStr === dateStr) {
      setSelectedDateStr(null);
      setShowDateModal(false);
    } else {
      setSelectedDateStr(dateStr);
      setSelectedMonthStr(null);
      setShowDateModal(true);
    }
  };

  const handleMonthClick = (monthKey: string) => {
    if (selectedMonthStr === monthKey) {
      setSelectedMonthStr(null);
    } else {
      setSelectedMonthStr(monthKey);
      setSelectedDateStr(null);
    }
  };

  const handleMonthChange = (delta: number) => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  // SVG Line Chart Coordinate Points
  const lineGraphPoints = useMemo(() => {
    const width = 600;
    const height = 160;
    const paddingX = 40;
    const paddingY = 25;

    const points = monthlyTrendData.map((d, idx) => {
      const x = paddingX + (idx / (monthlyTrendData.length - 1)) * (width - paddingX * 2);
      const y = height - paddingY - (d.total / maxMonthlyTotal) * (height - paddingY * 2);
      return { x, y, ...d };
    });

    const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    return { width, height, points, pathD, areaD };
  }, [monthlyTrendData, maxMonthlyTotal]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Date Filter Notification Banner */}
      {(selectedDateStr || selectedMonthStr) && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4 text-emerald-600" />
            <span>
              Filtering Analysis for Selected Filter:{' '}
              <strong className="text-slate-900">{selectedDateStr || selectedMonthStr}</strong> ({activeLogs.length} Items Purchased)
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedDateStr(null);
              setSelectedMonthStr(null);
              setShowDateModal(false);
            }}
            className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300 text-[11px] font-extrabold"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* 4 Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-700 text-white rounded-2xl p-5 shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between opacity-80 text-xs font-bold uppercase tracking-wider">
            <span>Total Spend</span>
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black">
            ₹{totals.grandTotal.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-100 font-semibold">
            {selectedDateStr ? `Spent on ${selectedDateStr}` : selectedMonthStr ? `Spent in ${selectedMonthStr}` : 'Overall Budget (With GST)'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Base Material Cost</span>
            <Receipt className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{totals.baseTotal.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">Excludes GST Taxes</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total GST Paid</span>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            +₹{totals.gstTotal.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold">Average ~14.2% GST</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Line Items Bought</span>
            <PackageCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totals.totalItems} Items
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">Across {categorySpend.length} Categories</p>
        </div>
      </div>

      {/* 📈 MONTHLY SPEND LINE GRAPH (SVG AREA CHART) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <LineChartIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Monthly Spend Line Graph (2026)</h3>
              <p className="text-xs text-slate-500">Total monthly procurement expenditure trend over time</p>
            </div>
          </div>
          {selectedMonthStr && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Filtered: {selectedMonthStr}
            </span>
          )}
        </div>

        {/* SVG Line Chart */}
        <div className="relative pt-2">
          <svg
            viewBox={`0 0 ${lineGraphPoints.width} ${lineGraphPoints.height}`}
            className="w-full h-44 overflow-visible"
          >
            <defs>
              <linearGradient id="emeraldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Line Markers */}
            <line x1="30" y1="30" x2="570" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="30" y1="80" x2="570" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="30" y1="135" x2="570" y2="135" stroke="#e2e8f0" strokeWidth="1" />

            {/* Gradient Fill under Line */}
            <path d={lineGraphPoints.areaD} fill="url(#emeraldAreaGrad)" />

            {/* Curved Smooth Line */}
            <path
              d={lineGraphPoints.pathD}
              fill="none"
              stroke="#059669"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Node Points */}
            {lineGraphPoints.points.map((p) => {
              const isSelected = selectedMonthStr === p.monthKey;
              const isHovered = hoveredPoint?.monthKey === p.monthKey;

              return (
                <g key={p.monthKey} className="cursor-pointer" onClick={() => handleMonthClick(p.monthKey)}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected || isHovered ? 7 : 5}
                    className={`transition-all ${
                      isSelected
                        ? 'fill-emerald-600 stroke-white stroke-[3]'
                        : 'fill-white stroke-emerald-600 stroke-[2.5] hover:fill-emerald-600'
                    }`}
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Month Label below */}
                  <text
                    x={p.x}
                    y="155"
                    textAnchor="middle"
                    className={`text-[10px] font-extrabold ${isSelected ? 'fill-emerald-700' : 'fill-slate-500'}`}
                  >
                    {p.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip Box */}
          {hoveredPoint && (
            <div
              className="absolute bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-xl text-xs space-y-0.5 pointer-events-none z-20 transition-all -translate-x-1/2 -translate-y-12"
              style={{
                left: `${(hoveredPoint.x / lineGraphPoints.width) * 100}%`,
                top: `${(hoveredPoint.y / lineGraphPoints.height) * 100}%`,
              }}
            >
              <div className="font-extrabold text-emerald-400">{hoveredPoint.label} 2026 Spend</div>
              <div className="font-black text-sm">₹{hoveredPoint.total.toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-slate-300">{hoveredPoint.count} Purchased Items</div>
            </div>
          )}
        </div>
      </div>

      {/* 📅 INTERACTIVE PROCUREMENT CALENDAR & CATEGORY SPEND */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Purchase Calendar (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Purchase Calendar</h3>
                <p className="text-xs text-slate-500 font-medium">Days products were bought</p>
              </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleMonthChange(-1)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-extrabold text-slate-800 px-1">
                {currentMonthDate.toLocaleString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
              <button
                onClick={() => handleMonthChange(1)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Header */}
          <div className="grid grid-cols-7 text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider pb-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Grid Body */}
          <div className="grid grid-cols-7 gap-1.5 text-xs font-bold">
            {calendarDays.map((d, idx) => {
              if (d.dayNumber === null) {
                return <div key={idx} className="h-10 rounded-xl bg-slate-50/50" />;
              }

              const isSelected = selectedDateStr === d.dateStr;

              return (
                <button
                  key={idx}
                  onClick={() => handleDateClick(d.dateStr)}
                  className={`h-10 rounded-xl border transition relative flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-500/20 scale-105 z-10'
                      : d.hasPurchase
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:border-emerald-500 hover:bg-emerald-100/70'
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                  }`}
                  title={d.hasPurchase ? `${d.itemCount} item(s) bought - ₹${d.totalAmount.toLocaleString('en-IN')}` : 'No purchases'}
                >
                  <span>{d.dayNumber}</span>
                  {d.hasPurchase && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full mt-0.5 ${
                        isSelected ? 'bg-white' : 'bg-emerald-600'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Green Dot = Purchase Date
            </span>
            {selectedDateStr && (
              <button
                onClick={() => setSelectedDateStr(null)}
                className="text-emerald-700 font-bold hover:underline"
              >
                Clear Date Filter
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Category Spend Breakdown (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <PieChart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Spend by Material Category</h3>
                <p className="text-xs text-slate-500 font-medium">Where your procurement budget goes</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {(showAllCategories ? categorySpend : categorySpend.slice(0, 5)).map((cat, idx) => (
              <div key={idx} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-extrabold">
                  <span className="text-slate-900">{cat.category}</span>
                  <div className="text-right">
                    <span className="text-emerald-700 font-black">₹{cat.amount.toLocaleString('en-IN')}</span>
                    <span className="text-slate-400 font-medium text-[11px] ml-2">({cat.percentOfTotal}%)</span>
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex items-center p-0.5">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(8, cat.barWidth)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {categorySpend.length > 5 && (
            <div className="pt-2 text-center border-t border-slate-100">
              <button
                onClick={() => setShowAllCategories((prev) => !prev)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition inline-flex items-center space-x-1.5 shadow-sm"
              >
                <span>{showAllCategories ? 'Show Less' : `View More (${categorySpend.length - 5} More Categories)`}</span>
                <span className="text-[10px]">{showAllCategories ? '▲' : '▼'}</span>
              </button>
            </div>
          )}
        </div>
      </div>



      {/* 📜 SELECTED DATE PURCHASED ITEMS MODAL */}
      {showDateModal && selectedDateStr && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setShowDateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-200 pb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Purchases on {selectedDateStr}
                </h3>
                <p className="text-xs text-emerald-700 font-bold">
                  {activeLogs.length} Item(s) Bought • Total: ₹{totals.grandTotal.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {activeLogs.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900">{item.productName}</h4>
                      <span className="text-[11px] text-emerald-700 font-bold block">{item.supplierName}</span>
                    </div>
                    <span className="font-black text-emerald-700 text-xs">
                      ₹{item.effectivePrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    <span>Category: <strong>{item.category}</strong></span>
                    <span>Invoice: <strong>{item.invoiceNo}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDateModal(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Close & View Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
