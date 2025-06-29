'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Client-side error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D3F8E2] via-[#A9DEF9] to-[#E4C1F9] p-4 font-sans flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-black mb-4">
          Something went wrong!
        </h1>
        <p className="text-gray-600 mb-6">
          We encountered an unexpected error. This might be due to a temporary issue or a problem with your device.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#F694C1] to-[#E4C1F9] text-white font-semibold rounded-xl hover:from-[#F694C1] hover:to-[#E4C1F9] transition-all duration-200 shadow-lg"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-[#A9DEF9] text-black font-semibold rounded-xl hover:bg-[#A9DEF9] hover:bg-opacity-80 transition-all duration-200"
          >
            Reload Page
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">
            If the problem persists, try:
          </p>
          <ul className="text-sm text-gray-500 mt-2 space-y-1">
            <li>• Refreshing the page</li>
            <li>• Clearing your browser cache</li>
            <li>• Using a different browser</li>
            <li>• Checking your internet connection</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 