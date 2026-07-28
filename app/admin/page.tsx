'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { AdminDashboardPage } from '@/components/pages/AdminDashboardPage';

function AdminContent() {
  const router = useRouter();
  const {
    isAdmin,
    stats,
    pendingMembers,
    approvedMembers,
    settings,
    handleUpdateSettings,
    handleApproveMember,
    handleRejectMember,
    refreshData,
    setIsAdminState
  } = useApp();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/login');
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminDashboardPage
      stats={stats}
      pendingMembers={pendingMembers}
      approvedMembers={approvedMembers}
      settings={settings}
      onUpdateSettings={handleUpdateSettings}
      onConfirmApprove={handleApproveMember}
      onRejectMember={handleRejectMember}
      onGoToIdCard={(regNo) => router.push(`/idcard?regNo=${encodeURIComponent(regNo)}`)}
      onRefreshData={refreshData}
    />
  );
}

export default function AdminRoute() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-700 font-extrabold text-sm">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          Loading Admin Control Center...
        </div>
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
}

