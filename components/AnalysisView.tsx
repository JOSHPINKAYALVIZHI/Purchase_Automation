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
  Plus,
  Zap,
  Phone,
  User,
  Check,
  Trash2,
} from 'lucide-react';

import { useAuth } from '@/lib/AuthContext';

interface LogFormItem {
  id: string;
  productName: string;
  category: string;
  customCategory: string;
  kwRating: string;
  specification: string;
  brand: string;
  hsn: string;
  basePrice: string;
  gstPercentage: string;
  discount: string;
  supplierId: string;
  invoiceNo: string;
  newCompanyName: string;
  newPhone: string;
  newAddress: string;
  newContactPerson: string;
}

export function AnalysisView() {
  const { approvedLogItems, addDirectLogItem } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletedLogIds, setDeletedLogIds] = useState<string[]>([]);

  // Calendar & Filter State
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [selectedMonthStr, setSelectedMonthStr] = useState<string | null>(null);
  const [showDateModal, setShowDateModal] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);

  // Multi-Item Purchase Log & Quote Form State
  const [showAddLogModal, setShowAddLogModal] = useState<boolean>(false);
  const [logDateInput, setLogDateInput] = useState<string>('');
  const [suppliersList, setSuppliersList] = useState<any[]>([]);

  const createEmptyLogItem = (defaultSupplierId: string = 'OTHER'): LogFormItem => ({
    id: `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    productName: '',
    category: 'Solar Equipment',
    customCategory: '',
    kwRating: '',
    specification: '',
    brand: '',
    hsn: '8541',
    basePrice: '',
    gstPercentage: '18',
    discount: '',
    supplierId: defaultSupplierId,
    invoiceNo: `FSCH/${Math.floor(10000 + Math.random() * 90000)}/25-26`,
    newCompanyName: '',
    newPhone: '',
    newAddress: '',
    newContactPerson: '',
  });

  const [logFormItems, setLogFormItems] = useState<LogFormItem[]>([]);
  const [submittingLog, setSubmittingLog] = useState<boolean>(false);

  useEffect(() => {
    const savedDeleted = localStorage.getItem('jesuans_deleted_log_ids');
    if (savedDeleted) {
      try {
        setDeletedLogIds(JSON.parse(savedDeleted));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/suppliers');
        const json = await res.json();
        if (json.success) {
          const items: any[] = [];

          json.data.forEach((s: any) => {
            if (s.products) {
              s.products.forEach((sp: any) => {
                const base = sp.basePrice || 0;
                const gstRate = sp.gstPercentage || 18;
                const gstAmt = (base * gstRate) / 100;
                const effective = sp.effectivePrice || base + gstAmt;

                let dateIsoStr = new Date().toISOString().split('T')[0];
                if (sp.updatedAt) {
                  const d = new Date(sp.updatedAt);
                  if (!isNaN(d.getTime())) {
                    dateIsoStr = d.toISOString().split('T')[0];
                  }
                } else if (sp.quotationDate) {
                  dateIsoStr = sp.quotationDate;
                }
                const monthKey = dateIsoStr.substring(0, 7);

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

  // Dynamically combine DB suppliers + past log entry suppliers for Company Vendor dropdown
  const allVendorsList = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Existing DB Suppliers
    suppliersList.forEach((s) => {
      if (s.companyName && s.companyName.trim()) {
        map.set(s.companyName.toLowerCase().trim(), {
          id: s.id,
          companyName: s.companyName.trim(),
          phone: s.phone || '',
          address: s.address || '',
          contactPerson: s.contactPerson || '',
        });
      }
    });

    // 2. Add suppliers from approvedLogItems past data
    approvedLogItems.forEach((item) => {
      const cName = (item.supplierName || item.newCompanyName || '').trim();
      if (cName && cName.toLowerCase() !== 'vendor') {
        const cKey = cName.toLowerCase();
        if (!map.has(cKey)) {
          map.set(cKey, {
            id: `sup_log_${cKey}`,
            companyName: cName,
            phone: item.phone || item.newPhone || '',
            address: item.address || item.newAddress || '',
            contactPerson: item.contactPerson || item.newContactPerson || '',
          });
        }
      }
    });

    // 3. Add suppliers from database logs
    logs.forEach((item) => {
      if (item.supplierName && item.supplierName.trim()) {
        const cName = item.supplierName.trim();
        if (cName.toLowerCase() !== 'vendor') {
          const cKey = cName.toLowerCase();
          if (!map.has(cKey)) {
            map.set(cKey, {
              id: `sup_db_${cKey}`,
              companyName: cName,
              phone: '',
              address: '',
              contactPerson: '',
            });
          }
        }
      }
    });

    return Array.from(map.values());
  }, [suppliersList, approvedLogItems, logs]);

  const openAddLogModalForDate = async (targetDateStr?: string) => {
    const dStr = targetDateStr || selectedDateStr || new Date().toISOString().split('T')[0];
    setLogDateInput(dStr);

    let fetchedSups: any[] = [];
    try {
      const res = await fetch('/api/suppliers');
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        fetchedSups = json.data;
        setSuppliersList(json.data);
      }
    } catch (e) {}

    const tempMap = new Map<string, any>();
    fetchedSups.forEach((s) => {
      if (s.companyName) tempMap.set(s.companyName.toLowerCase().trim(), s);
    });
    approvedLogItems.forEach((item) => {
      const cName = (item.supplierName || item.newCompanyName || '').trim();
      if (cName && cName.toLowerCase() !== 'vendor') {
        tempMap.set(cName.toLowerCase(), { id: `sup_log_${cName.toLowerCase()}`, companyName: cName });
      }
    });
    logs.forEach((item) => {
      const cName = (item.supplierName || '').trim();
      if (cName && cName.toLowerCase() !== 'vendor') {
        tempMap.set(cName.toLowerCase(), { id: `sup_db_${cName.toLowerCase()}`, companyName: cName });
      }
    });

    const availList = Array.from(tempMap.values());
    const initialSupplierId = availList.length > 0 ? availList[0].id : 'OTHER';

    setLogFormItems([createEmptyLogItem(initialSupplierId)]);
    setShowAddLogModal(true);
  };

  const handleAddAnotherItem = () => {
    const defaultSupp = allVendorsList.length > 0 ? allVendorsList[0].id : 'OTHER';
    setLogFormItems((prev) => [...prev, createEmptyLogItem(defaultSupp)]);
  };

  const handleRemoveFormItem = (itemId: string) => {
    if (logFormItems.length <= 1) return;
    setLogFormItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleUpdateItemField = (itemId: string, field: keyof LogFormItem, val: string) => {
    setLogFormItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [field]: val } : item))
    );
  };

  const handleCreateLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const item of logFormItems) {
      if (!item.productName.trim() || !item.basePrice) {
        alert('Please enter Product Name and Base Unit Price for all items.');
        return;
      }
      if (item.supplierId === 'OTHER' && !item.newCompanyName.trim()) {
        alert(`Please enter Company / Vendor Name for Item "${item.productName || 'New Item'}".`);
        return;
      }
    }

    try {
      setSubmittingLog(true);

      for (const item of logFormItems) {
        const finalCategory = item.category === 'CUSTOM' ? item.customCategory.trim() : item.category;
        const supplierObj = allVendorsList.find((s) => s.id === item.supplierId);

        const logData = {
          date: logDateInput,
          productName: item.productName.trim(),
          category: finalCategory || 'Solar Equipment',
          kwRating: item.kwRating.trim(),
          specification: item.specification.trim(),
          brand: item.brand.trim() || 'Standard Solar',
          hsn: item.hsn.trim() || '8541',
          basePrice: parseFloat(item.basePrice) || 0,
          gstPercentage: parseFloat(item.gstPercentage) || 18,
          invoiceNo: item.invoiceNo.trim() || `FSCH/${Math.floor(10000 + Math.random() * 90000)}/25-26`,
          discount: item.discount.trim() || '—',
          supplierName: item.supplierId === 'OTHER' ? item.newCompanyName.trim() : supplierObj?.companyName,
          phone: item.supplierId === 'OTHER' ? item.newPhone.trim() : supplierObj?.phone,
          address: item.supplierId === 'OTHER' ? item.newAddress.trim() : supplierObj?.address,
          newCompanyName: item.newCompanyName.trim(),
          newPhone: item.newPhone.trim(),
          newAddress: item.newAddress.trim(),
          newContactPerson: item.newContactPerson.trim(),
        };

        // Add to AuthContext state & localStorage
        addDirectLogItem(logData);

        // Also submit to backend database
        try {
          await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...logData,
              name: item.productName.trim(),
              unit: 'Pcs',
              isNewSupplier: item.supplierId === 'OTHER',
              supplierId: item.supplierId,
            }),
          });
        } catch (err) {}
      }

      setShowAddLogModal(false);
      setShowDateModal(false);
      setLogFormItems([]);
    } catch (err: any) {
      alert('Failed to save purchase log entries.');
    } finally {
      setSubmittingLog(false);
    }
  };

  const formattedApprovedItems = useMemo(() => {
    return approvedLogItems.map((item) => {
      const base = item.basePrice || 0;
      const gstRate = item.gstPercentage || 18;
      const gstAmt = (base * gstRate) / 100;
      const effective = item.effectivePrice || base + gstAmt;

      let dateIsoStr = new Date().toISOString().split('T')[0];
      if (item.date) {
        const d = new Date(item.date);
        if (!isNaN(d.getTime())) {
          dateIsoStr = d.toISOString().split('T')[0];
        }
      }
      const monthKey = dateIsoStr.substring(0, 7);

      return {
        id: item.id,
        supplierName: item.supplierName || 'Approved Vendor',
        category: item.category || 'Solar Equipment',
        productName: item.productName || 'Solar Item',
        brand: item.brand || 'Standard Make',
        invoiceNo: item.invoiceNo || 'FSCH/00139/25-26',
        basePrice: base,
        gstPercentage: gstRate,
        gstAmount: gstAmt,
        effectivePrice: effective,
        totalAmount: effective,
        dateStr: dateIsoStr,
        monthStr: monthKey,
      };
    });
  }, [approvedLogItems]);

  const validCombinedLogs = useMemo(() => {
    const combined = [...formattedApprovedItems, ...logs];
    return combined.filter((l) => !deletedLogIds.includes(l.id));
  }, [logs, formattedApprovedItems, deletedLogIds]);

  // Dynamically generate available years from dataset + range (2016 to 2036+)
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    const currentYr = new Date().getFullYear();

    // Dynamically generate 10 years past to 10 years future
    for (let y = currentYr - 10; y <= currentYr + 10; y++) {
      yearsSet.add(String(y));
    }

    validCombinedLogs.forEach((l) => {
      if (l.monthStr && l.monthStr.length >= 4) {
        yearsSet.add(l.monthStr.substring(0, 4));
      }
    });
    yearsSet.add(selectedYear);
    yearsSet.add(String(currentMonthDate.getFullYear()));

    return Array.from(yearsSet).sort((a, b) => Number(a) - Number(b));
  }, [validCombinedLogs, selectedYear, currentMonthDate]);

  // Filter logs if a specific date or month is selected (strictly excluding deleted log items)
  const activeLogs = useMemo(() => {
    if (selectedDateStr) {
      return validCombinedLogs.filter((l) => l.dateStr === selectedDateStr);
    }
    if (selectedMonthStr) {
      return validCombinedLogs.filter((l) => l.monthStr === selectedMonthStr);
    }
    return validCombinedLogs;
  }, [validCombinedLogs, selectedDateStr, selectedMonthStr]);

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

  // Group Spend Month by Month (All 12 Months Jan to Dec of selectedYear) for Line Graph
  const monthlyTrendData = useMemo(() => {
    const months = [
      { key: `${selectedYear}-01`, label: 'Jan' },
      { key: `${selectedYear}-02`, label: 'Feb' },
      { key: `${selectedYear}-03`, label: 'Mar' },
      { key: `${selectedYear}-04`, label: 'Apr' },
      { key: `${selectedYear}-05`, label: 'May' },
      { key: `${selectedYear}-06`, label: 'Jun' },
      { key: `${selectedYear}-07`, label: 'Jul' },
      { key: `${selectedYear}-08`, label: 'Aug' },
      { key: `${selectedYear}-09`, label: 'Sep' },
      { key: `${selectedYear}-10`, label: 'Oct' },
      { key: `${selectedYear}-11`, label: 'Nov' },
      { key: `${selectedYear}-12`, label: 'Dec' },
    ];

    const map: Record<string, { total: number; count: number }> = {};
    months.forEach((m) => {
      map[m.key] = { total: 0, count: 0 };
    });

    validCombinedLogs.forEach((l) => {
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
  }, [validCombinedLogs, selectedYear]);

  const maxMonthlyTotal = useMemo(() => {
    return Math.max(...monthlyTrendData.map((m) => m.total), 1);
  }, [monthlyTrendData]);

  // Group Spend by Date for Timeline Chart & Calendar Highlights
  const dateSpendMap = useMemo(() => {
    const map: Record<string, { total: number; count: number; items: any[] }> = {};
    validCombinedLogs.forEach((l) => {
      if (!map[l.dateStr]) {
        map[l.dateStr] = { total: 0, count: 0, items: [] };
      }
      map[l.dateStr].total += l.effectivePrice;
      map[l.dateStr].count += 1;
      map[l.dateStr].items.push(l);
    });
    return map;
  }, [validCombinedLogs]);

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

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, dateStr: null, hasPurchase: false, totalAmount: 0, itemCount: 0 });
    }

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

  const handleMonthSelectChange = (newMonthIdx: number) => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), newMonthIdx, 1));
  };

  const handleYearSelectChange = (newYearNum: number) => {
    setCurrentMonthDate((prev) => new Date(newYearNum, prev.getMonth(), 1));
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <LineChartIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Monthly Spend Line Graph ({selectedYear})</h3>
              <p className="text-xs text-slate-500">Total monthly procurement expenditure trend over time (All 12 Months)</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Infinite Year Input + Stepper Controls */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-sm">
              <button
                type="button"
                onClick={() => {
                  const newYr = String(Number(selectedYear) - 1);
                  setSelectedYear(newYr);
                  setCurrentMonthDate(new Date(Number(newYr), currentMonthDate.getMonth(), 1));
                }}
                className="p-1 rounded-lg hover:bg-white text-slate-700 transition"
                title="Previous Year"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <input
                type="number"
                value={selectedYear}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedYear(val);
                  if (val && !isNaN(Number(val))) {
                    setCurrentMonthDate(new Date(Number(val), currentMonthDate.getMonth(), 1));
                  }
                }}
                placeholder="Year"
                className="w-16 bg-white border border-slate-300 rounded-lg text-center font-black text-slate-900 py-0.5 focus:outline-none focus:border-emerald-600 text-xs shadow-inner"
              />

              <button
                type="button"
                onClick={() => {
                  const newYr = String(Number(selectedYear) + 1);
                  setSelectedYear(newYr);
                  setCurrentMonthDate(new Date(Number(newYr), currentMonthDate.getMonth(), 1));
                }}
                className="p-1 rounded-lg hover:bg-white text-slate-700 transition"
                title="Next Year"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {selectedMonthStr && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Filtered: {selectedMonthStr}
              </span>
            )}
          </div>
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

            <line x1="30" y1="30" x2="570" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="30" y1="80" x2="570" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="30" y1="135" x2="570" y2="135" stroke="#e2e8f0" strokeWidth="1" />

            <path d={lineGraphPoints.areaD} fill="url(#emeraldAreaGrad)" />

            <path
              d={lineGraphPoints.pathD}
              fill="none"
              stroke="#059669"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

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

          {hoveredPoint && (
            <div
              className="absolute bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-xl text-xs space-y-0.5 pointer-events-none z-20 transition-all -translate-x-1/2 -translate-y-12"
              style={{
                left: `${(hoveredPoint.x / lineGraphPoints.width) * 100}%`,
                top: `${(hoveredPoint.y / lineGraphPoints.height) * 100}%`,
              }}
            >
              <div className="font-extrabold text-emerald-400">{hoveredPoint.label} {selectedYear} Spend</div>
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

            {/* Separate Month and Year Navigation Controls */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-sm">
              <button
                type="button"
                onClick={() => handleMonthChange(-1)}
                className="p-1 rounded-lg hover:bg-white text-slate-700 transition"
                title="Previous Month"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <select
                value={currentMonthDate.getMonth()}
                onChange={(e) => handleMonthSelectChange(Number(e.target.value))}
                className="bg-transparent font-extrabold text-slate-900 text-xs px-1 py-0.5 focus:outline-none cursor-pointer"
              >
                {[
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ].map((mName, idx) => (
                  <option key={idx} value={idx}>
                    {mName}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={currentMonthDate.getFullYear()}
                onChange={(e) => {
                  const newYr = Number(e.target.value);
                  if (newYr && !isNaN(newYr)) {
                    setCurrentMonthDate(new Date(newYr, currentMonthDate.getMonth(), 1));
                    setSelectedYear(String(newYr));
                  }
                }}
                className="w-16 bg-white border border-slate-300 rounded text-center font-extrabold text-slate-900 py-0.5 focus:outline-none focus:border-emerald-600 text-xs ml-1"
              />

              <button
                type="button"
                onClick={() => handleMonthChange(1)}
                className="p-1 rounded-lg hover:bg-white text-slate-700 transition"
                title="Next Month"
              >
                <ChevronRight className="h-3.5 w-3.5" />
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
                  title={d.hasPurchase ? `${d.itemCount} item(s) bought - ₹${d.totalAmount.toLocaleString('en-IN')}` : 'Click to add log'}
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
        </div>

        {/* Right Column: Material Category Spend Breakdown (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <PieChart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Spend by Material Category</h3>
                <p className="text-xs text-slate-500 font-medium">Categorized expenditure ranking</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400">{categorySpend.length} Categories</span>
          </div>

          <div className="space-y-3">
            {(showAllCategories ? categorySpend : categorySpend.slice(0, 5)).map((cat) => (
              <div key={cat.category} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-extrabold">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-900">{cat.category}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">({cat.count} items)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-900 font-black">₹{cat.amount.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-emerald-700 font-bold ml-1.5">({cat.percentOfTotal}%)</span>
                  </div>
                </div>

                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
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

      {/* 📜 SELECTED DATE PURCHASED ITEMS & ADD LOG MODAL */}
      {showDateModal && selectedDateStr && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl relative text-slate-900 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowDateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-200 pb-3">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">
                  Purchases on {selectedDateStr}
                </h3>
                <p className="text-xs text-emerald-700 font-bold">
                  {activeLogs.length} Item(s) Logged • Total: ₹{totals.grandTotal.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {activeLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl border border-slate-200">
                  No purchases logged on {selectedDateStr}. Click below to add purchase log entries!
                </div>
              ) : (
                activeLogs.map((item) => (
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
                ))
              )}
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-200 gap-3">
              <button
                type="button"
                onClick={() => openAddLogModalForDate(selectedDateStr)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition flex items-center space-x-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>+ Add Items / Order for {selectedDateStr}</span>
              </button>

              <button
                onClick={() => setShowDateModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ➕ MULTI-ITEM PURCHASE LOG & QUOTE MODAL FOR PAST/CUSTOM DATES */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-3xl w-full space-y-6 shadow-2xl relative text-slate-900 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddLogModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-200 pb-4">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Add Purchase Order Log</h3>
                <p className="text-xs text-slate-500 font-bold">
                  Add 1 or more products bought on {logDateInput} with vendor & company invoice numbers
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateLogSubmit} className="space-y-6">
              {/* Purchase Date Header */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  1. Order Purchase Date
                </span>

                <div className="max-w-xs space-y-1.5 text-xs">
                  <label className="font-extrabold text-slate-700 block">
                    Purchase Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={logDateInput}
                    onChange={(e) => setLogDateInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
                  />
                </div>
              </div>

              {/* Multi-Item Product & Vendor Invoice List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                    2. Purchased Products, Company Vendors & Invoices ({logFormItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddAnotherItem}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold transition flex items-center space-x-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span> Add Product</span>
                  </button>
                </div>

                {logFormItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm relative"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        Item #{idx + 1}
                      </span>
                      {logFormItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFormItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 text-xs flex items-center space-x-1"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    {/* Company Vendor Selection & Company Invoice No for this specific item */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                      <div className="space-y-1.5 text-xs">
                        <label className="font-extrabold text-slate-800 flex items-center space-x-1">
                          <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Company Vendor *</span>
                        </label>
                        <select
                          value={item.supplierId}
                          onChange={(e) => handleUpdateItemField(item.id, 'supplierId', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-bold text-slate-900 focus:outline-none focus:border-emerald-600 text-xs cursor-pointer"
                        >
                          {allVendorsList.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.companyName} {s.phone ? `(${s.phone})` : ''}
                            </option>
                          ))}
                          <option value="OTHER">+ Add New Company / Vendor...</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <label className="font-extrabold text-slate-800 flex items-center space-x-1">
                          <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Company Invoice / PO Ref No</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. FSCH/00139/24-25"
                          value={item.invoiceNo}
                          onChange={(e) => handleUpdateItemField(item.id, 'invoiceNo', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-bold text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
                        />
                      </div>

                      {/* If New Company selected for this item */}
                      {item.supplierId === 'OTHER' && (
                        <div className="sm:col-span-2 p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2 mt-1">
                          <span className="text-[11px] font-black text-amber-900 block uppercase tracking-wider">
                            New Company Details for Item #{idx + 1}
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            <div>
                              <label className="font-extrabold text-slate-700 block mb-1">Company Name *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Festa Solar Pvt Ltd"
                                value={item.newCompanyName}
                                onChange={(e) => handleUpdateItemField(item.id, 'newCompanyName', e.target.value)}
                                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                              />
                            </div>
                            <div>
                              <label className="font-extrabold text-slate-700 block mb-1">Phone Number</label>
                              <input
                                type="text"
                                placeholder="e.g. +91 9876543210"
                                value={item.newPhone}
                                onChange={(e) => handleUpdateItemField(item.id, 'newPhone', e.target.value)}
                                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                              />
                            </div>
                            <div>
                              <label className="font-extrabold text-slate-700 block mb-1">Address / Location</label>
                              <input
                                type="text"
                                placeholder="e.g. Chennai / Coimbatore"
                                value={item.newAddress}
                                onChange={(e) => handleUpdateItemField(item.id, 'newAddress', e.target.value)}
                                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                              />
                            </div>
                            <div>
                              <label className="font-extrabold text-slate-700 block mb-1">Contact Person</label>
                              <input
                                type="text"
                                placeholder="e.g. Rajesh Kumar"
                                value={item.newContactPerson}
                                onChange={(e) => handleUpdateItemField(item.id, 'newContactPerson', e.target.value)}
                                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-xs">
                        <label className="font-extrabold text-slate-700 block">
                          Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Solar Panel 540W / Solar Inverter 10KW"
                          value={item.productName}
                          onChange={(e) => handleUpdateItemField(item.id, 'productName', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 font-bold text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <label className="font-extrabold text-slate-700 block">Category</label>
                        <select
                          value={item.category}
                          onChange={(e) => handleUpdateItemField(item.id, 'category', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 font-bold text-slate-900 focus:outline-none focus:border-emerald-600 text-xs cursor-pointer"
                        >
                          <option value="Solar Equipment">Solar Equipment</option>
                          <option value="Solar Panels">Solar Panels</option>
                          <option value="Inverters">Inverters</option>
                          <option value="Structure MMS">Structure MMS</option>
                          <option value="DC Cable">DC Cable</option>
                          <option value="ACDB Box">ACDB Box</option>
                          <option value="DCDB Box">DCDB Box</option>
                          <option value="Batteries">Batteries</option>
                          <option value="CUSTOM">+ Other Category...</option>
                        </select>
                        {item.category === 'CUSTOM' && (
                          <input
                            type="text"
                            required
                            placeholder="Enter custom category"
                            value={item.customCategory}
                            onChange={(e) => handleUpdateItemField(item.id, 'customCategory', e.target.value)}
                            className="w-full mt-2 bg-purple-50 border border-purple-300 rounded-xl px-3.5 py-2 font-bold text-slate-900 focus:outline-none focus:border-purple-600 text-xs"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-xs">
                        <label className="font-extrabold text-slate-700 block">KW Rating / Capacity</label>
                        <input
                          type="text"
                          placeholder="e.g. 100 KW, 50 KW"
                          value={item.kwRating}
                          onChange={(e) => handleUpdateItemField(item.id, 'kwRating', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 font-bold text-slate-900 focus:outline-none focus:border-emerald-600 text-xs placeholder:font-normal"
                        />
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <label className="font-extrabold text-slate-700 block">Specification Details</label>
                        <input
                          type="text"
                          placeholder="e.g. 3-Phase On-Grid / Mono PERC 144 Half-Cell"
                          value={item.specification}
                          onChange={(e) => handleUpdateItemField(item.id, 'specification', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 text-xs placeholder:font-normal"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">Make / Brand</label>
                        <input
                          type="text"
                          placeholder="e.g. Waaree"
                          value={item.brand}
                          onChange={(e) => handleUpdateItemField(item.id, 'brand', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">HSN Code</label>
                        <input
                          type="text"
                          placeholder="e.g. 8541"
                          value={item.hsn}
                          onChange={(e) => handleUpdateItemField(item.id, 'hsn', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">Unit Rate (₹) *</label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          placeholder="14500"
                          value={item.basePrice}
                          onChange={(e) => handleUpdateItemField(item.id, 'basePrice', e.target.value)}
                          className="w-full bg-white border border-emerald-400 rounded-xl px-2.5 py-1.5 text-xs font-black text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">GST %</label>
                        <select
                          value={item.gstPercentage}
                          onChange={(e) => handleUpdateItemField(item.id, 'gstPercentage', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-900 cursor-pointer"
                        >
                          <option value="18">18%</option>
                          <option value="12">12%</option>
                          <option value="5">5%</option>
                          <option value="28">28%</option>
                          <option value="0">0%</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Row */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleAddAnotherItem}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition flex items-center space-x-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add Product Item</span>
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddLogModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingLog}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition flex items-center space-x-2 disabled:opacity-50"
                  >
                    {submittingLog ? (
                      <span>Saving Log Items...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Save All ({logFormItems.length}) Items to Purchase Log</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
