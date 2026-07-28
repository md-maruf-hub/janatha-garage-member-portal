'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { JanathaGarageLogo } from './JanathaGarageLogo';
import {
  LayoutDashboard,
  UserPlus,
  CreditCard,
  ShieldCheck,
  Lock,
  Menu,
  X,
  Settings,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  isAdmin: boolean;
  onLogoutAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAdmin,
  onLogoutAdmin
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { id: 'registration', label: 'Registration', icon: UserPlus, href: '/registration' },
    { id: 'idcard', label: 'ID Card', icon: CreditCard, href: '/idcard' },
    { id: 'verify', label: 'Member Verification', icon: ShieldCheck, href: '/verify' },
    { id: 'admin', label: 'Admin Dashboard', icon: Settings, href: '/admin' }
  ];

  const isTabActive = (item: (typeof navItems)[0]) => {
    if (item.href === '/') {
      return pathname === '/' || pathname === '/dashboard';
    }
    if (item.id === 'admin' || item.id === 'login') {
      return pathname === '/admin' || pathname === '/login';
    }
    return pathname ? pathname.startsWith(item.href) : false;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link
            href="/"
            className="flex items-center gap-2 group text-left focus:outline-none"
          >
            <JanathaGarageLogo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isTabActive(item);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Admin Mode
                <button
                  onClick={onLogoutAdmin}
                  title="Logout Admin"
                  className="ml-1 p-1 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 pt-3 pb-6 space-y-2 shadow-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isTabActive(item);
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                {item.label}
              </Link>
            );
          })}

          {isAdmin && (
            <div className="pt-2">
              <button
                onClick={() => {
                  onLogoutAdmin();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout Admin Session
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
