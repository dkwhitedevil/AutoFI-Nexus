import React from 'react';
import { formatTimeAgo, formatCurrency } from '../../utils';
import type { RebalanceEvent } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';

interface RebalanceHistoryProps {
  history: RebalanceEvent[];
  isLoading: boolean;
}

export default function RebalanceHistory({ history, isLoading }: RebalanceHistoryProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Rebalance History
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Recent automated rebalancing events
        </p>
      </div>

      {history.length > 0 ? (
        <div className="space-y-4">
          {history.slice(0, 5).map((event) => (
            <div
              key={event.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Rebalance #{event.id}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimeAgo(event.timestamp)}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {event.reason}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(event.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Strategies:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {event.strategies.length}
                  </span>
                </div>
              </div>
              
              {event.strategies.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Strategy Allocations:
                  </div>
                  <div className="space-y-1">
                    {event.strategies.map((strategy, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400 font-mono">
                          {strategy.slice(0, 8)}...
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {formatCurrency(event.amounts[index] || '0')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No rebalance history
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Rebalancing events will appear here once they occur.
          </p>
        </div>
      )}

      {history.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
            View all rebalances →
          </button>
        </div>
      )}
    </div>
  );
}