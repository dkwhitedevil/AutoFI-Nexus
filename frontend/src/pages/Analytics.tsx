import React from 'react';

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Analytics
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Detailed performance analytics and insights.
        </p>
      </div>

      {/* Coming Soon */}
      <div className="card text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Analytics Coming Soon
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Advanced analytics features including detailed performance metrics, 
          risk analysis, and optimization recommendations will be available soon.
        </p>
      </div>
    </div>
  );
}