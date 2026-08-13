'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface UserSession {
  username: string;
  role: UserRole;
}

export interface ProcurementRequest {
  id: string;
  employeeName: string;
  items: any[];
  totalAmount: number;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface AppNotification {
  id: string;
  message: string;
  timestamp: string;
  targetRole: UserRole | 'ALL';
  read: boolean;
}

interface AuthContextType {
  user: UserSession | null;
  login: (u: string, p: string) => { success: boolean; error?: string };
  logout: () => void;
  pendingRequests: ProcurementRequest[];
  approvedLogItems: any[];
  notifications: AppNotification[];
  sendRequestToAdmin: (items: any[], total: number) => void;
  approveRequest: (requestId: string) => any[];
  rejectRequest: (requestId: string) => void;
  clearNotifications: () => void;
  purchaseLogStatuses: Record<string, 'SENT' | 'RECEIVED'>;
  toggleLogStatus: (logId: string) => void;
  addDirectLogItem: (item: any) => void;
  clearAllAppData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ProcurementRequest[]>([]);
  const [approvedLogItems, setApprovedLogItems] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [purchaseLogStatuses, setPurchaseLogStatuses] = useState<Record<string, 'SENT' | 'RECEIVED'>>({});

  useEffect(() => {
    setMounted(true);

    // Auto-wipe demo localStorage keys once so user browser matches clean DB
    if (typeof window !== 'undefined' && !localStorage.getItem('jesuans_v3_clean_reset')) {
      localStorage.removeItem('jesuans_approved_log_items');
      localStorage.removeItem('jesuans_deleted_log_ids');
      localStorage.removeItem('jesuans_log_statuses');
      localStorage.removeItem('jesuans_contact_overrides');
      localStorage.removeItem('jesuans_custom_products');
      localStorage.removeItem('jesuans_cart');
      localStorage.removeItem('jesuans_pending_requests');
      localStorage.setItem('jesuans_v3_clean_reset', 'true');
    }

    // Load saved user session
    const savedSession = localStorage.getItem('jesuans_user_session');
    if (savedSession) {
      try {
        setUser(JSON.parse(savedSession));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }

    // Load saved pending requests
    const savedRequests = localStorage.getItem('jesuans_pending_requests');
    if (savedRequests) {
      try {
        setPendingRequests(JSON.parse(savedRequests));
      } catch (e) {}
    }

    // Load saved approved log items
    const savedApproved = localStorage.getItem('jesuans_approved_log_items');
    if (savedApproved) {
      try {
        setApprovedLogItems(JSON.parse(savedApproved));
      } catch (e) {}
    }

    // Load saved notifications
    const savedNotifs = localStorage.getItem('jesuans_notifications');
    if (savedNotifs) {
      try {
        setNotifications(JSON.parse(savedNotifs));
      } catch (e) {}
    }

    // Load saved log statuses
    const savedStatuses = localStorage.getItem('jesuans_log_statuses');
    if (savedStatuses) {
      try {
        setPurchaseLogStatuses(JSON.parse(savedStatuses));
      } catch (e) {}
    }
  }, []);

  const login = (usernameInput: string, passwordInput: string) => {
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (cleanUser === 'admin' && cleanPass === 'admin@123') {
      const session: UserSession = { username: 'Admin', role: 'ADMIN' };
      setUser(session);
      localStorage.setItem('jesuans_user_session', JSON.stringify(session));
      return { success: true };
    }

    return { success: false, error: 'Invalid Username or Password' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('jesuans_user_session');
  };

  // Employee sends procurement request to Admin
  const sendRequestToAdmin = (items: any[], total: number) => {
    const newReq: ProcurementRequest = {
      id: 'REQ-' + Date.now(),
      employeeName: user?.username || 'Employee',
      items,
      totalAmount: total,
      date: new Date().toLocaleDateString('en-IN'),
      status: 'PENDING',
    };

    const updatedReqs = [newReq, ...pendingRequests];
    setPendingRequests(updatedReqs);
    localStorage.setItem('jesuans_pending_requests', JSON.stringify(updatedReqs));

    // Create Notification for Admin
    const newNotif: AppNotification = {
      id: 'NOTIF-' + Date.now(),
      message: `🔔 New Procurement Request (${items.length} items, ₹${total.toLocaleString('en-IN')}) submitted by ${newReq.employeeName}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      targetRole: 'ADMIN',
      read: false,
    };

    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    localStorage.setItem('jesuans_notifications', JSON.stringify(updatedNotifs));
  };

  // Admin approves procurement request -> converts to "SENT" status items
  const approveRequest = (requestId: string) => {
    const req = pendingRequests.find((r) => r.id === requestId);
    if (!req) return [];

    const updatedReqs = pendingRequests.map((r) =>
      r.id === requestId ? { ...r, status: 'APPROVED' as const } : r
    );
    setPendingRequests(updatedReqs);
    localStorage.setItem('jesuans_pending_requests', JSON.stringify(updatedReqs));

    // Create new approved items for purchase logs
    const newLogEntries = req.items.map((item, idx) => ({
      id: `APPROVED_${req.id}_${idx}`,
      supplierName: item.supplierName || item.supplier?.companyName || 'Approved Vendor',
      gstNumber: item.gstNumber || '33AAACG123456789',
      phone: item.supplierPhone || item.supplier?.phone || '',
      address: item.address || 'Coimbatore',
      productName: item.productName || item.name || 'Solar Material',
      category: item.category || 'Solar Equipment',
      specification: item.kwRating
        ? `${item.kwRating} • ${item.specification || 'Standard Spec'}`
        : item.specification || 'Standard Spec',
      brand: item.brand || 'Standard Make',
      hsn: item.hsn || '8541',
      basePrice: item.basePrice || 0,
      gstPercentage: item.gstPercentage || 18,
      effectivePrice: item.effectivePrice || item.basePrice * 1.18,
      invoiceNo: item.invoiceNo || `FSCH/${Math.floor(10000 + Math.random() * 90000)}/25-26`,
      discount: item.discount || '—',
      date: req.date,
    }));

    const updatedApprovedItems = [...newLogEntries, ...approvedLogItems];
    setApprovedLogItems(updatedApprovedItems);
    localStorage.setItem('jesuans_approved_log_items', JSON.stringify(updatedApprovedItems));

    // Set initial status of newly approved items to 'SENT'
    const newStatuses: Record<string, 'SENT' | 'RECEIVED'> = { ...purchaseLogStatuses };
    newLogEntries.forEach((item) => {
      newStatuses[item.id] = 'SENT';
    });
    setPurchaseLogStatuses(newStatuses);
    localStorage.setItem('jesuans_log_statuses', JSON.stringify(newStatuses));

    // Notify Employee
    const newNotif: AppNotification = {
      id: 'NOTIF-' + Date.now(),
      message: `✅ Order Approved by Admin! ${req.items.length} items logged as "SENT". Mark as "RECEIVED" upon delivery.`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      targetRole: 'EMPLOYEE',
      read: false,
    };

    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    localStorage.setItem('jesuans_notifications', JSON.stringify(updatedNotifs));

    return req.items;
  };

  const rejectRequest = (requestId: string) => {
    const updatedReqs = pendingRequests.map((r) =>
      r.id === requestId ? { ...r, status: 'REJECTED' as const } : r
    );
    setPendingRequests(updatedReqs);
    localStorage.setItem('jesuans_pending_requests', JSON.stringify(updatedReqs));

    const newNotif: AppNotification = {
      id: 'NOTIF-' + Date.now(),
      message: `❌ Order Request #${requestId} was rejected by Admin.`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      targetRole: 'EMPLOYEE',
      read: false,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    localStorage.setItem('jesuans_notifications', JSON.stringify(updatedNotifs));
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('jesuans_notifications');
  };

  const toggleLogStatus = (logId: string) => {
    const current = purchaseLogStatuses[logId] || 'SENT';
    const nextStatus: 'SENT' | 'RECEIVED' = current === 'SENT' ? 'RECEIVED' : 'SENT';
    const updated: Record<string, 'SENT' | 'RECEIVED'> = { ...purchaseLogStatuses, [logId]: nextStatus };
    setPurchaseLogStatuses(updated);
    localStorage.setItem('jesuans_log_statuses', JSON.stringify(updated));
  };

  const addDirectLogItem = (newItem: any) => {
    const basePrice = Number(newItem.basePrice) || 0;
    const gstPercentage = Number(newItem.gstPercentage) || 18;
    const effectivePrice = basePrice * (1 + gstPercentage / 100);

    const logEntry = {
      id: `LOG_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      supplierName: newItem.supplierName || newItem.newCompanyName || 'Vendor',
      gstNumber: newItem.newGstNumber || '33AAACG123456789',
      phone: newItem.newPhone || '',
      address: newItem.newAddress || 'Coimbatore',
      productName: newItem.productName || 'Solar Material',
      category: newItem.category || 'Solar Equipment',
      specification: newItem.kwRating
        ? `${newItem.kwRating} • ${newItem.specification || 'Standard Spec'}`
        : newItem.specification || 'Standard Spec',
      brand: newItem.brand || 'Standard Make',
      hsn: newItem.hsn || '8541',
      basePrice,
      gstPercentage,
      effectivePrice,
      invoiceNo: newItem.invoiceNo || `FSCH/${Math.floor(10000 + Math.random() * 90000)}/25-26`,
      discount: newItem.discount || '—',
      date: newItem.date || new Date().toISOString().split('T')[0],
    };

    const updatedApprovedItems = [logEntry, ...approvedLogItems];
    setApprovedLogItems(updatedApprovedItems);
    localStorage.setItem('jesuans_approved_log_items', JSON.stringify(updatedApprovedItems));

    const updatedStatuses: Record<string, 'SENT' | 'RECEIVED'> = {
      ...purchaseLogStatuses,
      [logEntry.id]: 'SENT',
    };
    setPurchaseLogStatuses(updatedStatuses);
    localStorage.setItem('jesuans_log_statuses', JSON.stringify(updatedStatuses));
  };

  const clearAllAppData = async () => {
    try {
      localStorage.removeItem('jesuans_approved_log_items');
      localStorage.removeItem('jesuans_deleted_log_ids');
      localStorage.removeItem('jesuans_log_statuses');
      localStorage.removeItem('jesuans_contact_overrides');
      localStorage.removeItem('jesuans_custom_products');
      localStorage.removeItem('jesuans_cart');
      localStorage.removeItem('jesuans_pending_requests');

      setApprovedLogItems([]);
      setPendingRequests([]);
      setPurchaseLogStatuses({});

      await fetch('/api/admin/clear-data', { method: 'POST' });
    } catch (e) {
      console.error('Error clearing data:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        pendingRequests,
        approvedLogItems,
        notifications,
        sendRequestToAdmin,
        approveRequest,
        rejectRequest,
        clearNotifications,
        purchaseLogStatuses,
        toggleLogStatus,
        addDirectLogItem,
        clearAllAppData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
