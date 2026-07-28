'use client';

import React from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { NotificationToast } from '@/components/NotificationToast';
import { MemberCardModal } from '@/components/MemberCardModal';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const {
    settings,
    isAdmin,
    notification,
    closeNotification,
    selectedMemberModal,
    setSelectedMemberModal,
    handleLogoutAdmin
  } = useApp();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar isAdmin={isAdmin} onLogoutAdmin={handleLogoutAdmin} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {children}
      </main>

      <Footer settings={settings} />

      <NotificationToast
        notification={notification}
        onClose={closeNotification}
      />

      {selectedMemberModal && (
        <MemberCardModal
          member={selectedMemberModal}
          onClose={() => setSelectedMemberModal(null)}
        />
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppShellContent>{children}</AppShellContent>
    </AppProvider>
  );
}
