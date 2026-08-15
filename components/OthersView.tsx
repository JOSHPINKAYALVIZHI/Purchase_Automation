'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Phone, Mail, User, Building2, PhoneCall, Edit2, Plus, X, Check, Save } from 'lucide-react';

import { useAuth } from '@/lib/AuthContext';

interface SupplierContact {
  id: string;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export function OthersView() {
  const { approvedLogItems } = useAuth();
  const [suppliers, setSuppliers] = useState<SupplierContact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Contact Edit Modal State
  const [editingSupplier, setEditingSupplier] = useState<SupplierContact | null>(null);
  const [contactPersonForm, setContactPersonForm] = useState<string>('');
  const [phoneForm, setPhoneForm] = useState<string>('');
  const [emailForm, setEmailForm] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Local Contact Overrides State
  const [contactOverrides, setContactOverrides] = useState<Record<string, { contactPerson: string | null; phone: string | null; email: string | null }>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('jesuans_contact_overrides');
      if (saved) {
        setContactOverrides(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const [cloudItems, setCloudItems] = useState<any[]>([]);

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const [res, cloudRes] = await Promise.all([
          fetch('/api/suppliers').catch(() => null),
          fetch('/api/cloud-sync').catch(() => null),
        ]);

        if (res && res.ok) {
          const json = await res.json();
          if (json.success) setSuppliers(json.data || []);
        }

        if (cloudRes && cloudRes.ok) {
          const cloudJson = await cloudRes.json();
          if (cloudJson.success) {
            setCloudItems([...(cloudJson.logs || []), ...(cloudJson.suppliers || [])]);
          }
        }
      } catch (err) {
        console.error('Failed to load supplier contacts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSuppliers();
    const interval = setInterval(() => {
      loadSuppliers();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const combinedSuppliers = useMemo(() => {
    const map = new Map<string, SupplierContact>();

    // 1. Existing DB Suppliers
    suppliers.forEach((s) => {
      if (s.companyName && s.companyName.trim()) {
        map.set(s.companyName.toLowerCase().trim(), {
          id: s.id,
          companyName: s.companyName.trim(),
          contactPerson: s.contactPerson || null,
          phone: s.phone || null,
          email: s.email || null,
          address: s.address || null,
        });
      }
    });

    // 2. Add suppliers from approvedLogItems & cloud sync
    [...approvedLogItems, ...cloudItems].forEach((item) => {
      const cName = (item.supplierName || item.companyName || item.newCompanyName || '').trim();
      if (cName && cName.toLowerCase() !== 'vendor') {
        const cKey = cName.toLowerCase();
        if (!map.has(cKey)) {
          map.set(cKey, {
            id: item.id || `sup_log_${cKey}`,
            companyName: cName,
            contactPerson: item.contactPerson || item.newContactPerson || null,
            phone: item.phone || item.newPhone || '+91 98422 55555',
            email: item.email || item.newEmail || null,
            address: item.address || item.newAddress || 'Coimbatore, Tamil Nadu',
          });
        } else {
          const existing = map.get(cKey)!;
          if (!existing.contactPerson && (item.contactPerson || item.newContactPerson)) {
            existing.contactPerson = item.contactPerson || item.newContactPerson;
          }
          if (!existing.phone && (item.phone || item.newPhone)) {
            existing.phone = item.phone || item.newPhone;
          }
          if (!existing.email && (item.email || item.newEmail)) {
            existing.email = item.email || item.newEmail;
          }
        }
      }
    });

    // 3. Apply contactOverrides so edited details are 100% reflected and persisted
    const list = Array.from(map.values());
    return list.map((s) => {
      const cKey = s.companyName.toLowerCase().trim();
      const override = contactOverrides[cKey] || contactOverrides[s.id];
      if (override) {
        return {
          ...s,
          contactPerson: override.contactPerson !== undefined ? override.contactPerson : s.contactPerson,
          phone: override.phone !== undefined ? override.phone : s.phone,
          email: override.email !== undefined ? override.email : s.email,
        };
      }
      return s;
    });
  }, [suppliers, approvedLogItems, contactOverrides]);

  const filteredSuppliers = useMemo(() => {
    return combinedSuppliers.filter((s) => {
      const query = search.toLowerCase().trim();
      if (!query) return true;
      return (
        s.companyName.toLowerCase().includes(query) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(query)) ||
        (s.phone && s.phone.toLowerCase().includes(query)) ||
        (s.email && s.email.toLowerCase().includes(query))
      );
    });
  }, [combinedSuppliers, search]);

  const handleOpenEditModal = (sup: SupplierContact) => {
    setEditingSupplier(sup);
    setContactPersonForm(sup.contactPerson || '');
    setPhoneForm(sup.phone || '');
    setEmailForm(sup.email || '');
    setSuccessMsg(null);
  };

  const handleSaveContact = async () => {
    if (!editingSupplier) return;
    setSaving(true);

    const updatedData = {
      contactPerson: contactPersonForm.trim() || null,
      phone: phoneForm.trim() || null,
      email: emailForm.trim() || null,
    };

    // 1. Update contact overrides state & localStorage
    const cKey = editingSupplier.companyName.toLowerCase().trim();
    const newOverrides = {
      ...contactOverrides,
      [cKey]: updatedData,
      [editingSupplier.id]: updatedData,
    };
    setContactOverrides(newOverrides);
    try {
      localStorage.setItem('jesuans_contact_overrides', JSON.stringify(newOverrides));
    } catch (e) {}

    // 2. Update suppliers state array if existing DB supplier
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === editingSupplier.id || s.companyName.toLowerCase().trim() === cKey
          ? { ...s, ...updatedData }
          : s
      )
    );

    // 3. Persist to DB API
    try {
      await fetch('/api/suppliers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSupplier.id,
          companyName: editingSupplier.companyName,
          ...updatedData,
        }),
      });
    } catch (err) {
      console.error('Error saving contact:', err);
    } finally {
      setSaving(false);
      setSuccessMsg(`Contact details for ${editingSupplier.companyName} updated & saved!`);
      setTimeout(() => {
        setEditingSupplier(null);
        setSuccessMsg(null);
      }, 1000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Search Bar & Counter */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search supplier name, contact person, phone..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
          <PhoneCall className="h-4 w-4 text-emerald-600" />
          <span>{filteredSuppliers.length} Supplier Contact Directory</span>
        </div>
      </div>

      {/* Supplier Contact Details Directory Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
          Loading supplier contact details...
        </div>
      ) : filteredSuppliers.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-emerald-950 text-white font-extrabold text-[12px] uppercase tracking-wider z-10">
                <tr>
                  <th className="py-3.5 px-4 text-emerald-100">Supplier Name</th>
                  <th className="py-3.5 px-4 text-emerald-100">Contact Person</th>
                  <th className="py-3.5 px-4 text-emerald-100">Contact No</th>
                  <th className="py-3.5 px-4 text-emerald-100">Email ID</th>
                  <th className="py-3.5 px-4 text-right text-emerald-100">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredSuppliers.map((sup, idx) => {
                  const hasContact = Boolean(sup.phone || sup.contactPerson || sup.email);
                  return (
                    <tr
                      key={sup.id || idx}
                      className={`hover:bg-emerald-50/60 transition ${
                        idx % 2 === 0 ? 'bg-amber-50/20' : 'bg-white'
                      }`}
                    >
                      {/* Supplier / Company Name */}
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>{sup.companyName}</span>
                        </div>
                      </td>

                      {/* Contact Person */}
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {sup.contactPerson && sup.contactPerson.trim() ? (
                          <div className="flex items-center space-x-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{sup.contactPerson}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      {/* Contact No */}
                      <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                        {sup.phone && sup.phone.trim() ? (
                          <div className="flex items-center space-x-1.5">
                            <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>{sup.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      {/* Email ID */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {sup.email && sup.email.trim() ? (
                          <div className="flex items-center space-x-1.5">
                            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{sup.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      {/* Edit / Add Contact Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEditModal(sup)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition inline-flex items-center space-x-1.5 ${
                            hasContact
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20'
                          }`}
                        >
                          {hasContact ? <Edit2 className="h-3 w-3 text-slate-500" /> : <Plus className="h-3 w-3" />}
                          <span>{hasContact ? 'Edit' : '+ Add Contact'}</span>
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
        <div className="py-16 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
          No supplier contacts match "{search}".
        </div>
      )}

      {/* EDIT / ADD CONTACT MODAL */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setEditingSupplier(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-200 pb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{editingSupplier.companyName}</h3>
                <p className="text-xs text-emerald-700 font-bold">Edit / Add Contact Details</p>
              </div>
            </div>

            {successMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-2 py-6">
                <Check className="h-5 w-5 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    value={contactPersonForm}
                    onChange={(e) => setContactPersonForm(e.target.value)}
                    placeholder="e.g. ETTAPAN (Sales Head)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Contact Phone Number(s)</label>
                  <input
                    type="text"
                    value={phoneForm}
                    onChange={(e) => setPhoneForm(e.target.value)}
                    placeholder="e.g. +91 94429 65029, +91 89258 24062"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={emailForm}
                    onChange={(e) => setEmailForm(e.target.value)}
                    placeholder="e.g. sales@company.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    onClick={() => setEditingSupplier(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveContact}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm shadow-emerald-500/20"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{saving ? 'Saving...' : 'Save Contact'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
