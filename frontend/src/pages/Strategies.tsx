import React from 'react';
import { useStrategies } from '../hooks/useStrategies';
import { useRebalancing } from '../hooks/useStrategies';
import { usePrivyContext } from '../contexts/PrivyContext';
import { formatPercentage, formatCurrency } from '../utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StrategyCard from '../components/strategy/StrategyCard';
import RebalanceHistory from '../components/strategy/RebalanceHistory';

export default function Strategies() {
  const { strategies, isLoadingData } = useStrategies();
  const { rebalanceHistory, isLoadingData: isLoadingHistory } = useRebalancing();
  const { isConnected } = usePrivyContext();

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Strategy Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Monitor and manage your yield farming strategies.
        </p>
      </div>

      {/* Strategies Overview */}
      <div className="card">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Active Strategies
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {strategies.length} strategies currently active
          </p>
        </div>

        {strategies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strategies.map((strategy) => (
              <StrategyCard key={strategy.address} strategy={strategy} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No strategies found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Strategies will appear here once they are registered and activated.
            </p>
          </div>
        )}
      </div>

      {/* Rebalance History */}
      <RebalanceHistory 
        history={rebalanceHistory} 
        isLoading={isLoadingHistory} 
      />

      {/* Strategy Performance Summary */}
      {strategies.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Performance Summary
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatPercentage(
                  strategies.reduce((sum, s) => sum + s.apy, 0) / strategies.length
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Average APY
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatPercentage(
                  strategies.reduce((sum, s) => sum + s.allocation, 0)
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Allocation
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Math.round(
                  strategies.reduce((sum, s) => sum + s.performanceScore, 0) / strategies.length
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Avg Performance Score
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}