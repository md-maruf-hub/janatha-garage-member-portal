'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { AdminLoginPage } from '@/components/pages/AdminLoginPage';

export default function LoginRoute() {
  const router = useRouter();
  const { isAdmin, setIsAdminState, showPopup } = useApp();

  useEffect(() => {
    if (isAdmin) {
      router.push('/admin');
    }
  }, [isAdmin, router]);

  const handleLogin = () => {
    setIsAdminState(true);
    showPopup('success', 'Admin Authenticated', 'Welcome to Janatha Garage Admin Panel');
    router.push('/admin');
  };

  return (
    <AdminLoginPage
      onLoginSuccess={handleLogin}
    />
  );
}
