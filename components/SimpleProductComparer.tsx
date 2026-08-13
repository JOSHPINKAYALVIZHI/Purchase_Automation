'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Zap,
  Trophy,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Star,
  CheckCircle2,
  X,
  Filter,
  History,
  Edit2,
  Trash2,
  HelpCircle,
  Plus,
  Minus,
  Check,
  Building2,
  User,
  Phone,
  MapPin,
} from 'lucide-react';
import { normalizeCategory } from '@/lib/normalizeCategory';
import { useAuth } from '@/lib/AuthContext';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  kwRating?: string;
  specification?: string;
  unit: string;
  supplierId: string;
  supplierName: string;
  supplierPhone?: string | null;
  contactPerson?: string | null;
  basePrice: number;
  gstPercentage: number;
  effectivePrice: number;
  quantity: number;
  leadTime: number;
  invoiceNo: string;
}

export function SimpleProductComparer() {
  const { user, sendRequestToAdmin, approvedLogItems } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // Card View Log Modal State (Filtered to searched product ONLY)
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [logCompanyOffer, setLogCompanyOffer] = useState<any>(null);

  // Editable Price State per Offer (local map: offerId -> { basePrice, gstPercentage })
  const [editedPrices, setEditedPrices] = useState<Record<string, { basePrice: number; gstPercentage: number }>>({});
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  // Explanation Modal State for Ratings & Delivery Days
  const [showMetricsHelp, setShowMetricsHelp] = useState<boolean>(false);

  // Add Product / Quote Modal State
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [allSuppliersList, setAllSuppliersList] = useState<any[]>([]);
  const [submittingProduct, setSubmittingProduct] = useState<boolean>(false);
  const [addProductSuccessMsg, setAddProductSuccessMsg] = useState<string>('');

  // Add To Cart Details Prompt Modal State (KW & Specification)
  const [showAddToCartDetailsModal, setShowAddToCartDetailsModal] = useState<boolean>(false);
  const [pendingCartOffer, setPendingCartOffer] = useState<any | null>(null);
  const [cartKwRating, setCartKwRating] = useState<string>('');
  const [cartSpecification, setCartSpecification] = useState<string>('');

  // Add Product Form State
  const [selectedExistingProductId, setSelectedExistingProductId] = useState<string>('NEW');
  const [formProductName, setFormProductName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Solar Equipment');
  const [formCustomCategory, setFormCustomCategory] = useState<string>('');
  const [formBrand, setFormBrand] = useState<string>('');
  const [formSpec, setFormSpec] = useState<string>('');
  const [formHsn, setFormHsn] = useState<string>('');
  const [formUnit, setFormUnit] = useState<string>('Pcs');
  const [formBasePrice, setFormBasePrice] = useState<string>('');
  const [formGstPercentage, setFormGstPercentage] = useState<string>('18');
  const [formInvoiceNo, setFormInvoiceNo] = useState<string>('');
  const [formDiscount, setFormDiscount] = useState<string>('');

  // Company Selection State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [newGstNumber, setNewGstNumber] = useState<string>('');
  const [newAddress, setNewAddress] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newContactPerson, setNewContactPerson] = useState<string>('');

  // Reusable loadProducts function
  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setProducts(json.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Combine DB products + past log entry products dynamically
  const combinedProducts = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Existing DB Products
    products.forEach((p) => {
      if (p.name) {
        map.set(p.name.toLowerCase().trim(), p);
      }
    });

    // 2. Combine Products from approvedLogItems past data
    approvedLogItems.forEach((item) => {
      const pName = (item.productName || 'Solar Item').trim();
      const pKey = pName.toLowerCase();

      if (!map.has(pKey)) {
        map.set(pKey, {
          id: `prod_log_${Math.abs(pKey.split('').reduce((acc: number, char: string) => (acc << 5) - acc + char.charCodeAt(0), 0))}`,
          name: pName,
          category: normalizeCategory(item.category || 'Solar Equipment'),
          brand: item.brand || 'Standard Make',
          specification: item.specification || `${pName} - ${item.brand || 'Standard Make'}`,
          hsn: item.hsn || '8541',
          unit: 'Pcs',
          inventory: [{ available: 20 }],
          supplierProducts: [],
        });
      }
    });

    return Array.from(map.values());
  }, [products, approvedLogItems]);

  // Dynamically combine DB suppliers + past log entry vendors for Add Product modal company dropdown
  const combinedSuppliersList = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Existing DB Suppliers
    allSuppliersList.forEach((s) => {
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

    return Array.from(map.values());
  }, [allSuppliersList, approvedLogItems]);

  // Fetch suppliers list when Add Product modal opens
  const fetchSuppliersForModal = async () => {
    try {
      const res = await fetch('/api/suppliers');
      const json = await res.json();
      if (json.success) {
        setAllSuppliersList(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching suppliers list:', err);
    }
  };

  const handleOpenAddProductModal = async () => {
    await fetchSuppliersForModal();

    if (combinedSuppliersList.length > 0) {
      setSelectedSupplierId(combinedSuppliersList[0].id);
    } else {
      setSelectedSupplierId('OTHER');
    }

    if (combinedProducts.length > 0) {
      const firstP = combinedProducts[0];
      setSelectedExistingProductId(firstP.id);
      setFormProductName(firstP.name);
      if (firstP.category) setFormCategory(firstP.category);
      if (firstP.brand) setFormBrand(firstP.brand);
      if (firstP.specification) setFormSpec(firstP.specification);
      if (firstP.hsn) setFormHsn(firstP.hsn);
      if (firstP.unit) setFormUnit(firstP.unit);
    } else {
      setSelectedExistingProductId('NEW');
      setFormProductName('');
    }
    setShowAddProductModal(true);
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProductName.trim() || !formBasePrice) {
      alert('Please enter Product Name and Base Price.');
      return;
    }

    if (selectedSupplierId === 'OTHER' && !newCompanyName.trim()) {
      alert('Please enter New Company Name.');
      return;
    }

    try {
      setSubmittingProduct(true);
      const finalCategory = formCategory === 'CUSTOM' ? formCustomCategory : formCategory;

      const payload = {
        name: formProductName.trim(),
        category: finalCategory.trim() || 'Solar Equipment',
        brand: formBrand.trim() || 'Standard Solar',
        specification: formSpec.trim() || `${formProductName.trim()} - ${formBrand.trim() || 'Standard'}`,
        hsn: formHsn.trim() || '8541',
        unit: formUnit,
        basePrice: parseFloat(formBasePrice),
        gstPercentage: parseFloat(formGstPercentage) || 18,
        invoiceNo: formInvoiceNo.trim() || undefined,
        discount: formDiscount.trim() || undefined,
        supplierId: selectedSupplierId,
        isNewSupplier: selectedSupplierId === 'OTHER',
        newCompanyName: newCompanyName.trim(),
        newGstNumber: newGstNumber.trim(),
        newAddress: newAddress.trim(),
        newPhone: newPhone.trim(),
        newEmail: newEmail.trim(),
        newContactPerson: newContactPerson.trim(),
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setAddProductSuccessMsg('✅ Product & Quote added successfully!');
        setTimeout(() => setAddProductSuccessMsg(''), 4000);
        await loadProducts();
        setFormProductName('');
        setFormBasePrice('');
        setFormBrand('');
        setFormSpec('');
        setNewCompanyName('');
        setNewAddress('');
        setNewPhone('');
        setNewContactPerson('');
        setShowAddProductModal(false);
      } else {
        alert(json.error || 'Failed to add product');
      }
    } catch (err: any) {
      console.error('Error submitting product:', err);
      alert(err?.message || 'Error creating product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Compute unique Categories dynamically from combined products
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    combinedProducts.forEach((p) => {
      if (p.category && p.category.trim()) {
        cats.add(normalizeCategory(p.category));
      }
    });
    return Array.from(cats).sort();
  }, [combinedProducts]);

  // Filter products by selected category dropdown & search query
  const filteredProducts = useMemo(() => {
    return combinedProducts.filter((p) => {
      const pNormCat = normalizeCategory(p.category);
      const matchesCategory =
        selectedCategory === 'ALL' || pNormCat === selectedCategory;

      const matchesSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        pNormCat.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [combinedProducts, selectedCategory, search]);

  useEffect(() => {
    if (selectedCategory === 'ALL' && !search.trim()) {
      setSelectedProduct(null);
      return;
    }

    if (
      filteredProducts.length > 0 &&
      (!selectedProduct || !filteredProducts.some((p) => p.id === selectedProduct.id))
    ) {
      setSelectedProduct(filteredProducts[0]);
    }
  }, [filteredProducts, selectedCategory, search]);

  // Fetch offers for selected product & merge past log quotations
  useEffect(() => {
    if (!selectedProduct) return;
    async function loadOffers() {
      try {
        setLoading(true);
        const res = await fetch(`/api/quotations?productId=${selectedProduct.id}`);
        const json = await res.json();
        let fetchedOffers = [];
        if (json.success) {
          fetchedOffers = json.data.quotations || [];
        }

        // Also merge matching log items from approvedLogItems
        const matchingLogOffers = approvedLogItems
          .filter(
            (item) =>
              item.productName &&
              item.productName.toLowerCase().trim() === selectedProduct.name.toLowerCase().trim()
          )
          .map((item) => ({
            id: item.id,
            basePrice: item.basePrice || 0,
            gstPercentage: item.gstPercentage || 18,
            effectivePrice: item.effectivePrice || 0,
            invoiceNo: item.invoiceNo || 'FSCH/00139/25-26',
            discount: item.discount || '—',
            supplier: {
              id: `sup_${item.supplierName}`,
              companyName: item.supplierName || 'Vendor',
              phone: item.phone || '+91 98422 55555',
              address: item.address || 'Coimbatore',
              rating: 4.8,
            },
            leadTime: 3,
          }));

        // Deduplicate offers by supplier company name
        const combinedMap = new Map<string, any>();
        fetchedOffers.forEach((o: any) => {
          if (o.supplier?.companyName) {
            combinedMap.set(o.supplier.companyName.toLowerCase().trim(), o);
          }
        });
        matchingLogOffers.forEach((mo) => {
          const sKey = mo.supplier.companyName.toLowerCase().trim();
          if (!combinedMap.has(sKey)) {
            combinedMap.set(sKey, mo);
          }
        });

        const finalOffers = Array.from(combinedMap.values());
        setOffers(finalOffers);

        // Initialize local editable prices map
        const initialEdits: Record<string, { basePrice: number; gstPercentage: number }> = {};
        finalOffers.forEach((o: any) => {
          initialEdits[o.id] = {
            basePrice: o.basePrice,
            gstPercentage: o.gstPercentage,
          };
        });
        setEditedPrices(initialEdits);
      } catch (err) {
        console.error('Error fetching offers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOffers();
  }, [selectedProduct, approvedLogItems]);

  // Calculate sorted offers based on current (edited or original) effective prices
  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => {
      const priceA = editedPrices[a.id]
        ? editedPrices[a.id].basePrice * (1 + editedPrices[a.id].gstPercentage / 100)
        : a.effectivePrice;
      const priceB = editedPrices[b.id]
        ? editedPrices[b.id].basePrice * (1 + editedPrices[b.id].gstPercentage / 100)
        : b.effectivePrice;
      return priceA - priceB;
    });
  }, [offers, editedPrices]);

  // Open Card Specific Log Modal (Only searched product log - static audit)
  const handleOpenProductLog = (offer: any) => {
    setLogCompanyOffer(offer);
    setShowLogModal(true);
  };

  // Open Add To Cart Details Prompt Modal (Ask KW & Specification)
  const handleAddToCart = (offer: any) => {
    setPendingCartOffer(offer);
    setCartKwRating('');
    setCartSpecification(selectedProduct?.specification || selectedProduct?.name || '');
    setShowAddToCartDetailsModal(true);
  };

  // Confirm Add To Cart with entered KW & Specification
  const handleConfirmAddToCartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCartOffer || !selectedProduct) return;

    const offer = pendingCartOffer;
    const edit = editedPrices[offer.id] || { basePrice: offer.basePrice, gstPercentage: offer.gstPercentage };
    const effectivePrice = Number((edit.basePrice * (1 + edit.gstPercentage / 100)).toFixed(2));

    const cartItemId = `${offer.supplier.id}_${selectedProduct.id}_${Date.now()}`;

    setCart((prevCart) => [
      ...prevCart,
      {
        id: cartItemId,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        kwRating: cartKwRating.trim(),
        specification: cartSpecification.trim(),
        unit: selectedProduct.unit || 'Pcs',
        supplierId: offer.supplier.id,
        supplierName: offer.supplier.companyName,
        supplierPhone: offer.supplier.phone,
        contactPerson: offer.supplier.contactPerson,
        basePrice: edit.basePrice,
        gstPercentage: edit.gstPercentage,
        effectivePrice,
        quantity: offer.minimumOrderQuantity || 10,
        leadTime: offer.leadTime,
        invoiceNo: offer.invoiceNo || 'FSCH/00139/25-26',
      },
    ]);

    setShowAddToCartDetailsModal(false);
    setPendingCartOffer(null);
    setShowCartDrawer(true);
  };

  // Update Cart Quantity
  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Estimated Cart Totals
  const cartSummary = useMemo(() => {
    const baseTotal = cart.reduce((acc, item) => acc + item.basePrice * item.quantity, 0);
    const gstTotal = cart.reduce(
      (acc, item) => acc + (item.effectivePrice - item.basePrice) * item.quantity,
      0
    );
    const grandTotal = baseTotal + gstTotal;
    const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    return { baseTotal, gstTotal, grandTotal, totalItemsCount };
  }, [cart]);

  // Final Order Now Execution from Cart
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (!isAdmin) {
      sendRequestToAdmin(cart, cartSummary.grandTotal);
      setOrderSuccessMsg(
        `✅ Procurement Request sent to Admin for approval! (${cartSummary.totalItemsCount} items, ₹${cartSummary.grandTotal.toLocaleString('en-IN')})`
      );
      setTimeout(() => {
        setCart([]);
        setShowCartDrawer(false);
        setOrderSuccessMsg(null);
      }, 2500);
      return;
    }

    try {
      // Create PO for first vendor group
      const firstVendorItem = cart[0];
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: firstVendorItem.supplierId,
          createdById: user?.username || 'Admin',
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.basePrice,
            gstPercentage: item.gstPercentage,
          })),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setOrderSuccessMsg(
          `Purchase Order ${json.data.poNumber} Placed & Logged! Total: ₹${json.data.totalAmount.toLocaleString('en-IN')}`
        );
        setTimeout(() => {
          setCart([]);
          setShowCartDrawer(false);
          setOrderSuccessMsg(null);
        }, 2500);
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Category Dropdown, Search Bar & Cart Button Row */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        {/* Category Dropdown Select */}
        <div className="relative w-full sm:w-64 shrink-0">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
            <Filter className="h-4 w-4" />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs sm:text-sm rounded-xl pl-10 pr-8 py-2.5 appearance-none focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
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
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {/* Balanced Cart Trigger Button */}
        <button
          onClick={() => setShowCartDrawer(true)}
          className="relative px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition flex items-center space-x-2 shrink-0 shadow-sm shadow-emerald-500/20 w-full sm:w-auto justify-center"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Cart ({cartSummary.totalItemsCount})</span>
          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center border-2 border-white">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Success Notification Banner */}
      {addProductSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in duration-150">
          <span>{addProductSuccessMsg}</span>
          <button onClick={() => setAddProductSuccessMsg('')}>
            <X className="h-4 w-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* 2. Filtered Product Buttons */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {selectedCategory === 'ALL' && !search.trim()
                ? 'Select a Category'
                : `Available Products (${filteredProducts.length})`}
            </span>
            {selectedCategory !== 'ALL' && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                Category: {selectedCategory}
              </span>
            )}
          </div>

          {/* Add Product Button */}
          <button
            onClick={handleOpenAddProductModal}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center space-x-1.5 shadow-sm shadow-emerald-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Product</span>
          </button>
        </div>

        {selectedCategory === 'ALL' && !search.trim() ? (
          <div className="py-6 text-center text-slate-500 text-xs font-semibold bg-white rounded-xl border border-slate-200 shadow-sm">
             Select a Category from the dropdown above to view available products.
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 max-h-56 overflow-y-auto p-1">
            {filteredProducts.map((p) => {
              const isSelected = selectedProduct?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-500/20 scale-105'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50'
                  }`}
                >
                  <Zap className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
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

      {/* 3. Company Price List (Low to High with Editable Prices & Add to Cart) */}
      {selectedProduct && (
        <div className="space-y-4 pt-2">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl font-extrabold text-slate-900">{selectedProduct.name}</h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
              Loading prices for {selectedProduct.name}...
            </div>
          ) : sortedOffers.length > 0 ? (
            <div className="space-y-3">
              {sortedOffers.map((offer, index) => {
                const isCheapest = index === 0;
                const currentEdit = editedPrices[offer.id] || {
                  basePrice: offer.basePrice,
                  gstPercentage: offer.gstPercentage,
                };
                const calculatedEffective = Number(
                  (currentEdit.basePrice * (1 + currentEdit.gstPercentage / 100)).toFixed(2)
                );
                const isEditing = editingOfferId === offer.id;

                return (
                  <div
                    key={offer.id}
                    className={`rounded-2xl p-5 border transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      isCheapest
                        ? 'bg-emerald-50/90 border-emerald-600 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    {/* Left Info */}
                    <div className="flex items-start space-x-3.5 flex-1 min-w-[240px]">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs ${
                          isCheapest
                            ? 'bg-emerald-600 text-white shadow-sm'
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
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider shrink-0">
                              Lowest Price
                            </span>
                          )}
                        </div>

                        {/* Company Contact Details & Location Address */}
                        <div className="space-y-0.5 text-xs text-slate-600 mt-1">
                          <div className="flex items-center space-x-1.5">
                            <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-800">
                              {offer.supplier?.contactPerson ? `${offer.supplier.contactPerson} • ` : ''}
                              {offer.supplier?.phone || '+91 98422 55555'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="text-slate-600">{offer.supplier?.address || 'Coimbatore, Tamil Nadu'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Quote Details Box & Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                      {/* Middle: Editable Price & GST Details */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 w-full sm:w-56 shrink-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                            Quote Details (Editable)
                          </span>
                          <button
                            onClick={() => setEditingOfferId(isEditing ? null : offer.id)}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1"
                          >
                            {isEditing ? <Check className="h-3.5 w-3.5" /> : <Edit2 className="h-3 w-3" />}
                            <span>{isEditing ? 'Done' : 'Edit Rate'}</span>
                          </button>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2 text-xs">
                            <div>
                              <label className="text-[10px] text-slate-500 font-bold block">Base Rate (₹)</label>
                              <input
                                type="number"
                                value={currentEdit.basePrice}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setEditedPrices((prev) => ({
                                    ...prev,
                                    [offer.id]: { ...currentEdit, basePrice: val },
                                  }));
                                }}
                                className="w-full bg-white border border-emerald-500 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-500 font-bold block">GST (%)</label>
                              <input
                                type="number"
                                value={currentEdit.gstPercentage}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setEditedPrices((prev) => ({
                                    ...prev,
                                    [offer.id]: { ...currentEdit, gstPercentage: val },
                                  }));
                                }}
                                className="w-full bg-white border border-emerald-500 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Base Rate:</span>
                              <strong className="text-slate-800">₹{currentEdit.basePrice.toLocaleString('en-IN')}</strong>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">GST ({currentEdit.gstPercentage}%):</span>
                              <strong className="text-slate-800">
                                +₹{((currentEdit.basePrice * currentEdit.gstPercentage) / 100).toLocaleString('en-IN')}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                              <span className="font-bold text-slate-700">With GST:</span>
                              <strong className="text-emerald-700 font-black text-sm">
                                ₹{calculatedEffective.toLocaleString('en-IN')}
                              </strong>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Action Buttons: View Log & ADD TO CART */}
                      <div className="flex sm:flex-col items-center sm:items-stretch gap-2 w-full sm:w-auto shrink-0">
                        {/* View Log Button (Static Historical Audit) */}
                        <button
                          onClick={() => handleOpenProductLog(offer)}
                          className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition flex items-center justify-center space-x-1.5 shrink-0 whitespace-nowrap w-1/2 sm:w-auto"
                          title="View static historical log for this product"
                        >
                          <History className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                          <span>View Log</span>
                        </button>

                        {/* ADD TO CART BUTTON */}
                        <button
                          onClick={() => handleAddToCart(offer)}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-1.5 shrink-0 whitespace-nowrap w-1/2 sm:w-auto ${
                            isCheapest
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          <ShoppingCart className="h-4 w-4 shrink-0" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
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

      {/* 🛒 SHOPPING CART DRAWER (With Estimated Overall Amount & Order Now Button) */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white max-w-md w-full h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto relative text-slate-900">
            <button
              onClick={() => setShowCartDrawer(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Cart Header */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-200 pb-4">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Procurement Shopping Cart</h3>
                  <p className="text-xs text-slate-500">{cart.length} Vendor Item(s) Selected</p>
                </div>
              </div>

              {orderSuccessMsg ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center flex flex-col items-center justify-center gap-3 py-12">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 animate-bounce" />
                  <span className="text-sm font-extrabold">{orderSuccessMsg}</span>
                </div>
              ) : cart.length > 0 ? (
                /* Cart Items List */
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-extrabold text-slate-900">{item.productName}</h4>
                          <span className="text-[11px] text-emerald-700 font-bold block">{item.supplierName}</span>
                          {(item.kwRating || item.specification) && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                              {item.kwRating && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-300">
                                  ⚡ {item.kwRating}
                                </span>
                              )}
                              {item.specification && (
                                <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 font-bold border border-slate-200">
                                  📋 {item.specification}
                                </span>
                              )}
                            </div>
                          )}
                          {item.supplierPhone && (
                            <span className="text-[10px] text-slate-600 font-semibold flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                              <span>{item.supplierPhone}</span>
                              {item.contactPerson ? <span className="text-slate-400 font-medium">({item.contactPerson})</span> : null}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleUpdateCartQuantity(item.id, -1)}
                            className="h-6 w-6 rounded-md bg-white border border-slate-300 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-100"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-extrabold text-slate-900 px-1">{item.quantity} {item.unit}</span>
                          <button
                            onClick={() => handleUpdateCartQuantity(item.id, 1)}
                            className="h-6 w-6 rounded-md bg-white border border-slate-300 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-100"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Unit: ₹{item.effectivePrice}</span>
                          <span className="font-extrabold text-slate-900 text-xs">
                            ₹{(item.effectivePrice * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                  Your cart is empty. Click "Add to Cart" on any product to estimate overall amount!
                </div>
              )}
            </div>

            {/* Cart Summary & Order Now Execution Button */}
            {!orderSuccessMsg && cart.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                {/* Overall Estimated Amount Card */}
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 shadow-lg">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                    Overall Estimated Amount Summary
                  </span>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Subtotal (Base Rates):</span>
                      <strong className="text-white">₹{cartSummary.baseTotal.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Total Estimated GST:</span>
                      <strong className="text-emerald-300">+₹{cartSummary.gstTotal.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-800">
                      <span className="font-black text-white">Grand Total Amount:</span>
                      <span className="font-black text-emerald-400 text-lg">
                        ₹{cartSummary.grandTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Final Order Now Execution Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full py-3.5 rounded-xl text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 bg-emerald-600 hover:bg-emerald-700 transition flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Order Now & Send to Purchase Log</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📜 CARD SPECIFIC VIEW LOG MODAL (Static Historical Audit) */}
      {showLogModal && logCompanyOffer && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full space-y-5 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setShowLogModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-200 pb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <History className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {logCompanyOffer.supplier.companyName}
                </h3>
                <p className="text-xs text-emerald-700 font-bold">
                  Static Audit Log: <strong className="text-slate-900">{selectedProduct.name}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex justify-between">
                <span><strong className="text-slate-900">{logCompanyOffer.supplier.contactPerson || logCompanyOffer.supplier.companyName}</strong></span>
                <span className="text-emerald-700 font-bold">✅ Static Historical Record</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[11px]">
                      <th className="py-2.5 px-3">Invoice No</th>
                      <th className="py-2.5 px-3">HSN Code</th>
                      <th className="py-2.5 px-3">Make</th>
                      <th className="py-2.5 px-3">Unit Rate</th>
                      <th className="py-2.5 px-3 text-emerald-700">With GST</th>
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
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {selectedProduct.brand}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        ₹{logCompanyOffer.basePrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-700">
                        ₹{logCompanyOffer.effectivePrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-600">
                        {logCompanyOffer.discount || '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* ========================================================= */}
      {/* 🚀 ADD NEW PRODUCT / QUOTE MODAL WITH COMPANY SELECTION  */}
      {/* ========================================================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-snug">Add Product / Supplier Quote</h3>
                  <p className="text-xs text-slate-400">Add new material or quote to compare instantly</p>
                </div>
              </div>

              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleAddProductSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* 1. Product Details Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-blue-600 tracking-wider flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" /> Product Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedExistingProductId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedExistingProductId(val);
                        if (val !== 'NEW') {
                          const found = combinedProducts.find((p) => p.id === val || p.name === val);
                          if (found) {
                            setFormProductName(found.name);
                            if (found.category) setFormCategory(found.category);
                            if (found.brand) setFormBrand(found.brand);
                            if (found.specification) setFormSpec(found.specification);
                            if (found.hsn) setFormHsn(found.hsn);
                            if (found.unit) setFormUnit(found.unit);
                          }
                        } else {
                          setFormProductName('');
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 mb-1.5 cursor-pointer"
                    >
                      {combinedProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category})
                        </option>
                      ))}
                      <option value="NEW">➕ + Add New Product Name...</option>
                    </select>

                    <input
                      type="text"
                      required
                      value={formProductName}
                      onChange={(e) => {
                        setFormProductName(e.target.value);
                        setSelectedExistingProductId('NEW');
                      }}
                      placeholder="Or enter new product name..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      {uniqueCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="CUSTOM">+ Other Category...</option>
                    </select>
                  </div>
                </div>

                {(formCategory === 'CUSTOM' || formCategory === '+ Other Category...') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Enter Custom Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formCustomCategory}
                      onChange={(e) => setFormCustomCategory(e.target.value)}
                      placeholder="e.g. Solar Inverter, Meter, Cable..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Make / Brand</label>
                    <input
                      type="text"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="e.g. Havells / Polycab"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">HSN Code</label>
                    <input
                      type="text"
                      value={formHsn}
                      onChange={(e) => setFormHsn(e.target.value)}
                      placeholder="e.g. 8541"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="Pcs">Pcs</option>
                      <option value="Nos">Nos</option>
                      <option value="Mtr">Mtr</option>
                      <option value="Set">Set</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Pricing & GST Details Section */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-black uppercase text-emerald-600 tracking-wider flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Pricing & Rate Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Base Rate (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formBasePrice}
                      onChange={(e) => setFormBasePrice(e.target.value)}
                      placeholder="e.g. 4500"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">GST %</label>
                    <select
                      value={formGstPercentage}
                      onChange={(e) => setFormGstPercentage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="18">18% GST</option>
                      <option value="12">12% GST</option>
                      <option value="5">5% GST</option>
                      <option value="0">0% GST (Exempt)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Discount Rate (Optional)</label>
                    <input
                      type="text"
                      value={formDiscount}
                      onChange={(e) => setFormDiscount(e.target.value)}
                      placeholder="e.g. 5% Special"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Company Selection & New Vendor Details Section */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-black uppercase text-purple-600 tracking-wider flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> Supplier / Company Name
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Company <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    {combinedSuppliersList.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.companyName} {sup.phone ? `(${sup.phone})` : ''}
                      </option>
                    ))}
                    <option value="OTHER">➕ Other / Add New Company...</option>
                  </select>
                </div>

                {/* Conditional Fields if "Other / Add New Company" is selected */}
                {(selectedSupplierId === 'OTHER' || selectedSupplierId === '' || combinedSuppliersList.length === 0) && (
                  <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-2xl space-y-3 animate-in fade-in duration-150">
                    <div className="text-xs font-extrabold text-purple-900 flex items-center gap-1 border-b border-purple-200 pb-2">
                      <User className="h-3.5 w-3.5 text-purple-600" />
                      <span>New Company & Contact Details</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newCompanyName}
                          onChange={(e) => setNewCompanyName(e.target.value)}
                          placeholder="e.g. SKYLINE SOLAR SOLUTIONS"
                          className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="e.g. +91 98422 12345"
                          className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Company Address</label>
                      <input
                        type="text"
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        placeholder="e.g. 104 Industrial Estate, Coimbatore"
                        className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person Name</label>
                        <input
                          type="text"
                          value={newContactPerson}
                          onChange={(e) => setNewContactPerson(e.target.value)}
                          placeholder="e.g. Rajesh Kumar (Purchase Mgr)"
                          className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Number (Optional)</label>
                        <input
                          type="text"
                          value={formInvoiceNo}
                          onChange={(e) => setFormInvoiceNo(e.target.value)}
                          placeholder="e.g. FSCH/00139/25-26"
                          className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-600"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition flex items-center space-x-2 disabled:opacity-50"
                >
                  {submittingProduct ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Save Product</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚡ ASK KW & SPECIFICATION ADD TO CART PROMPT MODAL */}
      {showAddToCartDetailsModal && pendingCartOffer && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative text-slate-900 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAddToCartDetailsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-200 pb-4">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Add to Cart Details</h3>
                <p className="text-xs text-slate-500 font-bold">
                  {selectedProduct.name} • <span className="text-emerald-700">{pendingCartOffer.supplier.companyName}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmAddToCartSubmit} className="space-y-4">
              <div className="space-y-1.5 text-xs">
                <label className="font-extrabold text-slate-700 block">
                  Capacity / KW Rating <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100 KW, 50 KW, 5 KW..."
                  value={cartKwRating}
                  onChange={(e) => setCartKwRating(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-emerald-600 placeholder:font-normal text-xs"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-extrabold text-slate-700 block">
                  Specification Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. 3-Phase On-Grid Solar Inverter, Monocrystalline Half-Cell..."
                  value={cartSpecification}
                  onChange={(e) => setCartSpecification(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 placeholder:font-normal text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddToCartDetailsModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition flex items-center space-x-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Confirm & Add to Cart</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
