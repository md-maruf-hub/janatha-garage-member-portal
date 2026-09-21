'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  getApprovedMembers,
  getPendingMembers,
  getStoredSettings,
  saveStoredSettings,
  saveApprovedMembers,
  savePendingMembers,
  approvePendingMember,
  rejectPendingMember,
  isAdminLoggedIn,
  setAdminLoggedIn,
  DEFAULT_SETTINGS
} from '@/lib/storage';
import {
  fetchApprovedMembersFromGAS,
  fetchPendingMembersFromGAS,
  approveMemberInGAS,
  rejectMemberInGAS
} from '@/lib/gasApi';
import { MemberRecord, AppSettings, NotificationState, MemberType, DashboardStats } from '@/types';

interface AppContextType {
  approvedMembers: MemberRecord[];
  pendingMembers: MemberRecord[];
  settings: AppSettings;
  isAdmin: boolean;
  stats: DashboardStats;
  notification: NotificationState;
  selectedMemberModal: MemberRecord | null;
  setSelectedMemberModal: (m: MemberRecord | null) => void;
  refreshData: () => Promise<void>;
  showPopup: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  closeNotification: () => void;
  handleApproveMember: (pendingId: string, memberType: MemberType) => Promise<void>;
  handleRejectMember: (pendingId: string, email?: string, fullName?: string) => Promise<void>;
  handleUpdateSettings: (newSettings: AppSettings) => void;
  handleLogoutAdmin: () => void;
  setIsAdminState: (admin: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [approvedMembers, setApprovedMembers] = useState<MemberRecord[]>([]);
  const [pendingMembers, setPendingMembers] = useState<MemberRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [selectedMemberModal, setSelectedMemberModal] = useState<MemberRecord | null>(null);

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    const checkServerAdmin = async () => {
      try {
        const res = await fetch('/api/admin/check');
        if (res.ok) {
          const data = await res.json();
          if (data.isAdmin) {
            setIsAdmin(true);
            setAdminLoggedIn(true);
            return;
          }
        }
      } catch (e) {
        // Fallback to stored state if offline
      }
      setIsAdmin(isAdminLoggedIn());
    };

    checkServerAdmin();
    refreshData();
  }, []);


  const refreshData = async () => {
    const curSettings = getStoredSettings();
    setSettings(curSettings);

    const localApproved = getApprovedMembers();
    const localPending = getPendingMembers();
    setApprovedMembers(localApproved);
    setPendingMembers(localPending);

    const gasUrl = curSettings.gasWebAppUrl || DEFAULT_SETTINGS.gasWebAppUrl;
    if (gasUrl) {
      try {
        const [gasApproved, gasPending] = await Promise.all([
          fetchApprovedMembersFromGAS(gasUrl),
          fetchPendingMembersFromGAS(gasUrl)
        ]);

        if (Array.isArray(gasApproved) && gasApproved.length > 0) {
          setApprovedMembers(gasApproved);
          saveApprovedMembers(gasApproved);
        }
        if (Array.isArray(gasPending)) {
          setPendingMembers(gasPending);
          savePendingMembers(gasPending);
        }
      } catch (e) {
        console.warn('Google Sheets live fetch notice:', e);
      }
    }
  };

  const showPopup = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setNotification({
      show: true,
      type,
      title,
      message
    });
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  const handleApproveMember = async (pendingId: string, memberType: MemberType) => {
    const applicant =
      pendingMembers.find((m) => m.id === pendingId) ||
      getPendingMembers().find((m) => m.id === pendingId);

    const sendServerApprovalMail = async (regNo?: string) => {
      if (!applicant?.email) return;
      try {
        await fetch('/api/send-approval-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: applicant.email,
            fullName: applicant.fullName,
            regNumber: regNo,
            memberType
          })
        });
      } catch (err) {
        console.error('Failed to send server approval email:', err);
      }
    };

    if (settings.gasWebAppUrl) {
      const gasRes = await approveMemberInGAS(settings.gasWebAppUrl, pendingId, memberType);
      if (gasRes.success) {
        approvePendingMember(pendingId, memberType);
        await refreshData();
        await sendServerApprovalMail(gasRes.registrationNumber);
        showPopup(
          'success',
          'Application Approved',
          `Registration Number ${gasRes.registrationNumber || 'generated'} has been set.\nRole assigned: ${memberType}.\nApproval email with ID card link dispatched to ${applicant?.email || 'applicant'}.`
        );
        return;
      } else {
        showPopup('error', 'Google Sheets Approval Failed', gasRes.message);
        return;
      }
    }

    const res = approvePendingMember(pendingId, memberType);
    if (res.success) {
      refreshData();
      await sendServerApprovalMail(res.registrationNumber);
      showPopup(
        'success',
        'Application Approved Successfully',
        `Registration Number ${res.registrationNumber} generated.\nRole assigned: ${memberType}.\nApproval email with ID card link sent.`
      );
    } else {
      showPopup('error', 'Approval Failed', res.message);
    }
  };

  const handleRejectMember = async (pendingId: string, email?: string, fullName?: string) => {
    const applicant =
      pendingMembers.find((m) => m.id === pendingId) ||
      getPendingMembers().find((m) => m.id === pendingId);

    const applicantEmail = email || applicant?.email;
    const applicantName = fullName || applicant?.fullName;

    const sendServerMail = async () => {
      if (!applicantEmail) return;
      try {
        await fetch('/api/send-rejection-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: applicantEmail, fullName: applicantName })
        });
      } catch (err) {
        console.error('Failed to send server rejection email:', err);
      }
    };

    // Send rejection email FIRST before record deletion
    await sendServerMail();

    if (settings.gasWebAppUrl) {
      await rejectMemberInGAS(
        settings.gasWebAppUrl,
        pendingId,
        applicantEmail,
        applicantName
      );
      rejectPendingMember(pendingId);
      await refreshData();

      showPopup(
        'info',
        'Application Rejected',
        `Application rejected. Rejection notice dispatched to ${applicantEmail || 'applicant'}.`
      );
      return;
    }

    const res = rejectPendingMember(pendingId);
    if (res.success) {
      refreshData();
      showPopup(
        'info',
        'Application Rejected',
        `The pending request was removed. Rejection notice sent to ${applicantEmail || 'applicant'}.`
      );
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    refreshData();
  };

  const handleLogoutAdmin = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    setAdminLoggedIn(false);
    setIsAdmin(false);
    showPopup('info', 'Logged Out', 'You have logged out of the admin panel.');
  };


  const setIsAdminState = (admin: boolean) => {
    setAdminLoggedIn(admin);
    setIsAdmin(admin);
  };

  const stats = useMemo<DashboardStats>(() => {
    const bloodGroupCounts: Record<string, number> = {
      'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'O+': 0, 'O-': 0, 'AB+': 0, 'AB-': 0
    };
    approvedMembers.forEach((m) => {
      if (bloodGroupCounts[m.bloodGroup] !== undefined) {
        bloodGroupCounts[m.bloodGroup]++;
      }
    });
    return {
      totalMembers: approvedMembers.length,
      pendingCount: pendingMembers.length,
      approvedCount: approvedMembers.length,
      rejectedCount: 0,
      bloodGroupCounts,
      recentApproved: approvedMembers.slice(0, 5)
    };
  }, [approvedMembers, pendingMembers]);

  return (
    <AppContext.Provider
      value={{
        approvedMembers,
        pendingMembers,
        settings,
        isAdmin,
        stats,
        notification,
        selectedMemberModal,
        setSelectedMemberModal,
        refreshData,
        showPopup,
        closeNotification,
        handleApproveMember,
        handleRejectMember,
        handleUpdateSettings,
        handleLogoutAdmin,
        setIsAdminState
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

const defaultFallbackContext: AppContextType = {
  approvedMembers: [],
  pendingMembers: [],
  settings: DEFAULT_SETTINGS,
  isAdmin: false,
  stats: {
    totalMembers: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    bloodGroupCounts: { 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'O+': 0, 'O-': 0, 'AB+': 0, 'AB-': 0 },
    recentApproved: []
  },
  notification: { show: false, type: 'success', title: '', message: '' },
  selectedMemberModal: null,
  setSelectedMemberModal: () => {},
  refreshData: async () => {},
  showPopup: () => {},
  closeNotification: () => {},
  handleApproveMember: async () => {},
  handleRejectMember: async () => {},
  handleUpdateSettings: () => {},
  handleLogoutAdmin: () => {},
  setIsAdminState: () => {}
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    return defaultFallbackContext;
  }
  return context;
};
