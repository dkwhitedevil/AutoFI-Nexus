import React, { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useTheme } from '../contexts/ThemeContext';
import { formatAddress, formatCurrency } from '../utils';
import { 
  UserIcon, 
  WalletIcon, 
  Cog6ToothIcon, 
  BellIcon, 
  ShieldCheckIcon,
  ChartBarIcon,
  SparklesIcon,
  CheckCircleIcon,
  SunIcon,
  MoonIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function Profile() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { theme, toggleTheme } = useTheme();
  
  const [ethBalance, setEthBalance] = useState<string>('0.00');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const wallet = wallets[0]; // Get the first connected wallet
  const isConnected = ready && authenticated && !!wallet;

  // Function to fetch ETH balance using Web3 provider
  const fetchEthBalance = async () => {
    if (!wallet || !wallet.address) {
      setEthBalance('0.00');
      return;
    }

    setIsLoadingBalance(true);
    setBalanceError(null);

    try {
      // Get the wallet's provider
      const provider = await wallet.getEthersProvider();
      
      // Fetch balance in wei
      const balanceWei = await provider.getBalance(wallet.address);
      
      // Convert wei to ETH (1 ETH = 10^18 wei)
      const balanceEth = parseFloat(balanceWei.toString()) / Math.pow(10, 18);
      
      // Format to 4 decimal places
      setEthBalance(balanceEth.toFixed(4));
      setLastUpdated(new Date());
      
      console.log('✅ ETH balance fetched:', balanceEth.toFixed(4), 'ETH');
    } catch (error) {
      console.error('❌ Error fetching ETH balance:', error);
      setBalanceError('Failed to fetch balance');
      setEthBalance('0.00');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Fetch balance when wallet connects or changes
  useEffect(() => {
    if (isConnected && wallet) {
      fetchEthBalance();
      
      // Set up periodic balance refresh (every 30 seconds)
      const interval = setInterval(fetchEthBalance, 30000);
      
      return () => clearInterval(interval);
    } else {
      setEthBalance('0.00');
      setBalanceError(null);
      setLastUpdated(null);
    }
  }, [isConnected, wallet?.address]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-5 mb-8">
            <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/30 shadow-lg">
              <UserIcon className="icon-2xl text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent">
                Profile Settings
              </h1>
              <p className="text-primary-100 text-xl font-medium mt-3">
                Manage your account, wallet, and application preferences
              </p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Enhanced Wallet Information */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl shadow-lg">
            <WalletIcon className="icon-xl text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Wallet Information
          </h2>
        </div>
        
        {isConnected && wallet ? (
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-2xl p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500 rounded-2xl shadow-lg">
                    <CheckCircleIcon className="icon-xl text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-800 dark:text-green-200">
                      Wallet Connected
                    </div>
                    <div className="text-base text-green-600 dark:text-green-400 font-mono mt-1">
                      {formatAddress(wallet.address, 12)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-green-500 rounded-full shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm font-bold text-white">
                    Active
                  </span>
                </div>
              </div>
            </div>
            
            {/* Wallet Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500 rounded-2xl shadow-lg">
                      <ChartBarIcon className="icon-xl text-white" />
                    </div>
                    <span className="text-base font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">ETH Balance</span>
                  </div>
                  <button
                    onClick={fetchEthBalance}
                    disabled={isLoadingBalance}
                    className="p-2 bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    title="Refresh balance"
                  >
                    <ArrowPathIcon className={`h-4 w-4 text-blue-600 dark:text-blue-400 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {isLoadingBalance ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span>Loading...</span>
                    </div>
                  ) : balanceError ? (
                    <span className="text-red-500 text-lg">{balanceError}</span>
                  ) : (
                    `${ethBalance} ETH`
                  )}
                </div>
                {lastUpdated && !isLoadingBalance && !balanceError && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </div>
                )}
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700 rounded-2xl p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-purple-500 rounded-2xl shadow-lg">
                    <ShieldCheckIcon className="icon-xl text-white" />
                  </div>
                  <span className="text-base font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Network</span>
                </div>
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  Localhost
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <WalletIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No wallet connected
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Connect your wallet to view your profile information and manage your DeFi portfolio.
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
            <Cog6ToothIcon className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Preferences
          </h2>
        </div>
        
        <div className="space-y-6">
          {/* Theme Toggle */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  {theme === 'light' ? (
                    <SunIcon className="h-6 w-6 text-yellow-500" />
                  ) : (
                    <MoonIcon className="h-6 w-6 text-blue-500" />
                  )}
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Theme
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Currently using {theme} mode
                  </div>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-lg flex items-center gap-2"
              >
                <span>Switch to {theme === 'light' ? 'Dark' : 'Light'}</span>
                {theme === 'light' ? (
                  <MoonIcon className="h-4 w-4" />
                ) : (
                  <SunIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          
          {/* Notifications */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <BellIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    Notifications
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Transaction and performance alerts
                  </div>
                </div>
              </div>
              <button 
                className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 font-medium py-3 px-6 rounded-xl transition-all duration-200 cursor-not-allowed opacity-50"
                disabled
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Chain Portfolio */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <ChartBarIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Multi-Chain Portfolio
          </h2>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Target vs current allocations across chains. Live data wiring coming next.
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Chain</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Asset</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Target Weight</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Current Weight</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Drift</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">Ethereum</td>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">USDC</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">40.00%</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">39.20%</td>
                <td className="px-4 py-3"><span className="text-yellow-600 dark:text-yellow-400">-0.80%</span></td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">Arbitrum</td>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">USDC.e</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">30.00%</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">30.50%</td>
                <td className="px-4 py-3"><span className="text-green-600 dark:text-green-400">+0.50%</span></td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">Polygon</td>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">USDT</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">30.00%</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">30.30%</td>
                <td className="px-4 py-3"><span className="text-green-600 dark:text-green-400">+0.30%</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced App Information */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
            <SparklesIcon className="h-6 w-6 text-accent-600 dark:text-accent-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Application Information
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Version</span>
            </div>
            <div className="text-xl font-bold text-green-900 dark:text-green-100">
              1.0.0
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              Latest Release
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
                <ShieldCheckIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Network</span>
            </div>
            <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
              Localhost
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Development
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                <Cog6ToothIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Environment</span>
            </div>
            <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
              Development
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Local Testing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}