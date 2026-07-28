'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { DashboardPage } from '@/components/pages/DashboardPage';

export default function DashboardRoute() {
  const router = useRouter();
  const { stats, approvedMembers, setSelectedMemberModal } = useApp();

  return (
    <DashboardPage
      stats={stats}
      approvedMembers={approvedMembers}
      onSelectMember={(m) => setSelectedMemberModal(m)}
      onGoToIdCard={(regNo) => router.push(`/idcard?regNo=${encodeURIComponent(regNo)}`)}
      onNavigate={(tab) => {
        const path = tab === 'dashboard' || tab === 'home' ? '/' : `/${tab}`;
        router.push(path);
      }}
    />
  );
}
