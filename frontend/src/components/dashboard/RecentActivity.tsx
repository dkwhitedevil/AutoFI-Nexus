import React from 'react';
import { formatTimeAgo, formatCurrency } from '../../utils';
import type { Transaction } from '../../types';

// Mock recent activity data
const mockTransactions: Transaction[] = [
  {
    hash: '0x1234...5678',
    type: 'deposit',
    amount: '1000',
    timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    status: 'confirmed',
    gasUsed: '50000',
    gasPrice: '20',
  },
  {
    hash: '0x2345...6789',
    type: 'rebalance',
    timestamp: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago
    status: 'confirmed',
    gasUsed: '75000',
    gasPrice: '20',
  },
  {
    hash: '0x3456...7890',
    type: 'strategy_execution',
    amount: '500',
    timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    status: 'confirmed',
    gasUsed: '60000',
    gasPrice: '20',
  },
];

export default function RecentActivity() {
  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return '📥';
      case 'withdraw':
        return '📤';
      case 'rebalance':
        return '🔄';
      case 'strategy_execution':
        return '⚙️';
      default:
        return '📋';
    }
  };

  const getTransactionLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdraw':
        return 'Withdrawal';
      case 'rebalance':
        return 'Rebalancing';
      case 'strategy_execution':
        return 'Strategy Execution';
      default:
        return 'Transaction';
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 dark:text-green-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Recent Activity
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your latest transactions
        </p>
      </div>

      <div className="space-y-3">
        {mockTransactions.map((transaction) => (
          <div
            key={transaction.hash}
            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div className="flex items-center">
              <div className="text-2xl mr-3">
                {getTransactionIcon(transaction.type)}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {getTransactionLabel(transaction.type)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {formatTimeAgo(transaction.timestamp)}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {transaction.amount && (
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(transaction.amount)}
                </div>
              )}
              <div className={`text-xs ${getStatusColor(transaction.status)}`}>
                {transaction.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
          View all transactions →
        </button>
      </div>
    </div>
  );
}