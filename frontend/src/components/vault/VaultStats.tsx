import type { UserVaultData, VaultInfo } from '../../types';
import { formatCurrency, formatLargeNumber } from '../../utils';

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
    <div className="card gradient-bg glass-effect shadow-glow p-8 rounded-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gradient-glow mb-1">Vault Statistics</h2>
        <p className="text-base text-gray-400 font-medium">Current vault metrics and your position</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-gradient-to-br from-purple-900/40 to-gray-900/60 rounded-2xl p-6 shadow-glass hover:shadow-glow transition-all duration-300 text-center">
            <div className="text-3xl font-extrabold text-gradient-neon drop-shadow-glow mb-1">{stat.value}</div>
            <div className="text-base font-semibold text-gray-200 mb-1">{stat.name}</div>
            <div className="text-xs text-gray-400">{stat.description}</div>
          </div>
        ))}
      </div>

      {/* Additional info */}
      {vaultInfo && (
        <div className="mt-8 pt-6 border-t border-purple-800/40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <span className="text-gray-400">Asset Token:</span>
              <span className="ml-2 font-mono text-accent-400">USDC</span>
            </div>
            <div>
              <span className="text-gray-400">Min Deposit:</span>
              <span className="ml-2 font-mono text-accent-400">{formatCurrency(vaultInfo.minDeposit)}</span>
            </div>
            <div>
              <span className="text-gray-400">Lock Period:</span>
              <span className="ml-2 font-mono text-accent-400">7 days</span>
            </div>
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="mt-8 p-4 bg-gradient-to-r from-purple-900/30 to-gray-900/40 rounded-xl">
          <p className="text-base text-gray-400 text-center">
            Connect your wallet to view your vault position and perform transactions.
          </p>
        </div>
      )}
    </div>
  );
}