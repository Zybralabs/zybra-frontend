"use client";

import React from 'react';

interface FallbackPageProps {
  error?: Error;
  title?: string;
  message?: string;
}

export default function FallbackPage({ 
  error, 
  title = "Something went wrong",
  message = "We're experiencing technical difficulties. Please try again later."
}: FallbackPageProps) {
  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-darkBlue px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="bg-darkGreen rounded-lg p-8 shadow-lg">
          {/* Logo or Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-midGreen rounded-full flex items-center justify-center mx-auto">
              <svg 
                className="w-8 h-8 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-4">
            {title}
          </h1>

          {/* Message */}
          <p className="text-gray-300 mb-6">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              className="w-full bg-midGreen text-white py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors font-medium"
            >
              Try Again
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full bg-transparent border border-gray-500 text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Go Home
            </button>
          </div>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-red-400 text-sm font-medium">
                Error Details (Development)
              </summary>
              <div className="mt-3 p-3 bg-red-900 bg-opacity-20 rounded border border-red-500 border-opacity-30">
                <p className="text-red-300 text-xs font-mono break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="mt-2 text-red-300 text-xs font-mono overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}

          {/* Support Info */}
          <div className="mt-6 pt-6 border-t border-gray-600">
            <p className="text-gray-400 text-sm">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
