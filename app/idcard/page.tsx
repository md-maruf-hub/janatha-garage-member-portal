'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { IdCardPage } from '@/components/pages/IdCardPage';

function IdCardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const regNo = searchParams ? searchParams.get('regNo') || '' : '';
  const { approvedMembers, settings } = useApp();

  return (
    <IdCardPage
      approvedMembers={approvedMembers}
      settings={settings}
      initialRegNo={regNo}
      onNavigate={(tab) => {
        const path = tab === 'dashboard' || tab === 'home' ? '/' : `/${tab}`;
        router.push(path);
      }}
    />
  );
}

export default function IdCardRoute() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Loading ID Card Generator...</div>}>
      <IdCardContent />
    </Suspense>
  );
}
