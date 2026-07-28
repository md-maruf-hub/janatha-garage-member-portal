'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { VerificationPage } from '@/components/pages/VerificationPage';

function VerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const regNo = searchParams ? searchParams.get('regNo') || '' : '';
  const { approvedMembers } = useApp();

  return (
    <VerificationPage
      approvedMembers={approvedMembers}
      initialRegNo={regNo}
      onNavigate={(tab) => {
        const path = tab === 'dashboard' || tab === 'home' ? '/' : `/${tab}`;
        router.push(path);
      }}
    />
  );
}

export default function VerificationRoute() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Loading Verification Portal...</div>}>
      <VerificationContent />
    </Suspense>
  );
}
