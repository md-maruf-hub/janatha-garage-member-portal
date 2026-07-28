'use client';

import React from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 max-w-md w-full">
        <h3 className="font-bold text-base mb-1">An Error Occurred</h3>
        <p className="text-xs text-rose-600">{error?.message || 'Something went wrong while displaying this page.'}</p>
        <button
          onClick={() => reset()}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          Try Reloading
        </button>
      </div>
    </div>
  );
}
