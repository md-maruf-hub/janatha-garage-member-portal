'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md w-full space-y-3">
        <h2 className="text-2xl font-black text-slate-800">404 - Page Not Found</h2>
        <p className="text-xs text-slate-500">The page you are looking for does not exist or has been moved.</p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all"
        >
          Return to Portal Home
        </Link>
      </div>
    </div>
  );
}
