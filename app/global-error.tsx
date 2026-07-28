'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-rose-400">Something went wrong</h2>
          <p className="text-xs text-slate-400">{error?.message || 'An unexpected error occurred in the application.'}</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
