import React from 'react';
import { formatCurrency, formatPercentage, formatLargeNumber } from '../../utils';
import type { VaultInfo, UserVaultData } from '../../types';

interface PortfolioOverviewProps {
  vaultInfo: VaultInfo | null;
  userVaultData: UserVaultData | null;
  analytics: {
    apy: number;
    totalYield: string;
    riskScore: number;
  };
  isConnected: boolean;
}

export default function PortfolioOverview({
  vaultInfo,
  userVaultData,
  analytics,
  isConnected,
}: PortfolioOverviewProps) {
  const stats = [
    {
      name: 'Total Value Locked',
      value: vaultInfo ? formatLargeNumber(vaultInfo.totalAssets) : '0',
      change: '+12.5%',
      changeType: 'positive' as const,
    },
    {
      name: 'Your Balance',
      value: userVaultData ? formatCurrency(userVaultData.balance) : '$0.00',
      change: '+8.2%',
      changeType: 'positive' as const,
    },
    {
      name: 'Current APY',
      value: formatPercentage(analytics.apy),
      change: '+0.5%',
      changeType: 'positive' as const,
    },
    {
      name: 'Risk Score',
      value: `${analytics.riskScore}/10`,
      change: '-0.2',
      changeType: 'positive' as const,
    },
  ];

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Portfolio Overview
        </h2>
        {!isConnected && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Connect your wallet to view your portfolio details
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {stat.name}
            </div>
            <div className={`text-xs mt-1 ${
              stat.changeType === 'positive'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* User-specific info */}
      {isConnected && userVaultData && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(userVaultData.balance)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Your Balance
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatPercentage(userVaultData.sharePercentage)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Share Percentage
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {userVaultData.isLocked ? 'Locked' : 'Available'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Status
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}