'use client';

import React from 'react';
import Link from 'next/link';
import { JanathaGarageLogo } from './JanathaGarageLogo';
import { MapPin, Phone, Mail, Shield } from 'lucide-react';
import { AppSettings } from '@/types';

interface FooterProps {
  settings: AppSettings;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          <div className="space-y-4">
            <JanathaGarageLogo size="lg" lightText={true} />
            <p className="text-slate-400 text-sm leading-relaxed mt-3">
              Official Member Management Portal for Janatha Garage. Empowering our community with unified registration, digital verification, and PVC membership credentials.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-lg w-fit">
              <Shield className="w-3.5 h-3.5" /> Verified Organization Portal
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-bold text-base tracking-wide border-l-4 border-emerald-500 pl-3">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link
                  href="/"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Member Dashboard & Stats
                </Link>
              </li>
              <li>
                <Link
                  href="/registration"
                  className="hover:text-emerald-400 transition-colors"
                >
                  New Member Registration
                </Link>
              </li>
              <li>
                <Link
                  href="/idcard"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Download PVC Membership Card
                </Link>
              </li>
              <li>
                <Link
                  href="/verify"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Member QR Verification
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-bold text-base tracking-wide border-l-4 border-blue-500 pl-3">
              Contact Information
            </h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>{settings.orgAddress}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <a href={`tel:${settings.orgPhone}`} className="hover:text-white transition-colors">
                  {settings.orgPhone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <a href={`mailto:${settings.orgEmail}`} className="hover:text-white transition-colors">
                  {settings.orgEmail}
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-bold text-base tracking-wide border-l-4 border-amber-500 pl-3">
              Portal Administration
            </h4>
            <p className="text-sm text-slate-400">
              Authorized executives can access pending applications and manage membership databases.
            </p>
            <Link
              href="/admin"
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 text-center block"
            >
              Admin Portal Access
            </Link>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} {settings.orgName}. All Rights Reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built with precision for</span>
            <span className="font-semibold text-slate-200">{settings.orgName}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
