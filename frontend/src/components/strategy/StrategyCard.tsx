import React from 'react';
import { formatPercentage, formatCurrency, formatAddress } from '../../utils';
import type { Strategy } from '../../types';

interface StrategyCardProps {
  strategy: Strategy;
}

export default function StrategyCard({ strategy }: StrategyCardProps) {
  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {strategy.name}
        </h3>
        <span className={`px-2 py-1 text-xs rounded-full ${
          strategy.isActive
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        }`}>
          {strategy.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Allocation:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatPercentage(strategy.allocation)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Max Allocation:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatPercentage(strategy.maxAllocation)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">APY:</span>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {formatPercentage(strategy.apy)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Performance:</span>
          <span className={`text-sm font-medium ${getPerformanceColor(strategy.performanceScore)}`}>
            {strategy.performanceScore}/100 ({getPerformanceLabel(strategy.performanceScore)})
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Deposited:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatCurrency(strategy.totalDeposited)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Withdrawn:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatCurrency(strategy.totalWithdrawn)}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          {formatAddress(strategy.address)}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        <button className="btn-primary flex-1 text-sm">
          Manage
        </button>
        <button className="btn-outline flex-1 text-sm">
          Details
        </button>
      </div>
    </div>
  );
}