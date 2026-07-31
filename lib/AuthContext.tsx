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
  notifications: AppNotification[];
  sendRequestToAdmin: (items: any[], total: number) => void;
  approveRequest: (requestId: string) => any[];
  rejectRequest: (requestId: string) => void;
  clearNotifications: () => void;
  purchaseLogStatuses: Record<string, 'SENT' | 'RECEIVED'>;
  toggleLogStatus: (logId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ProcurementRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [purchaseLogStatuses, setPurchaseLogStatuses] = useState<Record<string, 'SENT' | 'RECEIVED'>>({});

  useEffect(() => {
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

    if (cleanUser === 'admin' && cleanPass === 'admin_1234') {
      const session: UserSession = { username: 'Admin', role: 'ADMIN' };
      setUser(session);
      localStorage.setItem('jesuans_user_session', JSON.stringify(session));
      return { success: true };
    }

    if (cleanUser === 'employee' && cleanPass === 'employee_2026') {
      const session: UserSession = { username: 'Employee', role: 'EMPLOYEE' };
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

    // Set initial status of newly approved items to 'SENT'
    const newStatuses = { ...purchaseLogStatuses };
    req.items.forEach((item) => {
      newStatuses[item.id] = 'SENT';
    });
    setPurchaseLogStatuses(newStatuses);
    localStorage.setItem('jesuans_log_statuses', JSON.stringify(newStatuses));

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

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        pendingRequests,
        notifications,
        sendRequestToAdmin,
        approveRequest,
        rejectRequest,
        clearNotifications,
        purchaseLogStatuses,
        toggleLogStatus,
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
