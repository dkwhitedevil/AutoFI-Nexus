import React from 'react';
import { formatCurrency, formatLargeNumber } from '../../utils';
import type { VaultInfo, UserVaultData } from '../../types';

interface VaultStatsProps {
  vaultInfo: VaultInfo | null;
  userVaultData: UserVaultData | null;
  isConnected: boolean;
}

export default function VaultStats({
  vaultInfo,
  userVaultData,
  isConnected,
}: VaultStatsProps) {
  const stats = [
    {
      name: 'Total Value Locked',
      value: vaultInfo ? formatLargeNumber(vaultInfo.totalAssets) : '0',
      description: 'Total assets in the vault',
    },
    {
      name: 'Total Shares',
      value: vaultInfo ? formatLargeNumber(vaultInfo.totalShares) : '0',
      description: 'Total vault shares issued',
    },
    {
      name: 'Your Balance',
      value: userVaultData ? formatCurrency(userVaultData.balance) : '$0.00',
      description: 'Your current vault balance',
    },
    {
      name: 'Your Shares',
      value: userVaultData ? formatCurrency(userVaultData.shares) : '0',
      description: 'Your vault shares',
    },
  ];

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Vault Statistics
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Current vault metrics and your position
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stat.value}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
              {stat.name}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {stat.description}
            </div>
          </div>
        ))}
      </div>

      {/* Additional info */}
      {vaultInfo && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Asset Token:</span>
              <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                USDC
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Min Deposit:</span>
              <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                {formatCurrency(vaultInfo.minDeposit)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Lock Period:</span>
              <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                7 days
              </span>
            </div>
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Connect your wallet to view your vault position and perform transactions.
          </p>
        </div>
      )}
    </div>
  );
}