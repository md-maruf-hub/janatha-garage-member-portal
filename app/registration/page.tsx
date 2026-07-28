'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { RegistrationPage } from '@/components/pages/RegistrationPage';

export default function RegistrationRoute() {
  const router = useRouter();
  const { settings, refreshData, showPopup } = useApp();

  return (
    <RegistrationPage
      settings={settings}
      onNavigate={(tab) => {
        const path = tab === 'dashboard' || tab === 'home' ? '/' : `/${tab}`;
        router.push(path);
      }}
      onSuccessSubmit={(msg) => {
        refreshData();
        showPopup('success', 'Registration Submitted', msg);
        router.push('/dashboard');
      }}
      onErrorSubmit={(msg) => {
        showPopup('error', 'Registration Error', msg);
      }}
    />
  );
}
