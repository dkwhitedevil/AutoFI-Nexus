import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  MinusIcon, 
  CogIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';
import type { VaultInfo, UserVaultData } from '../../types';

interface QuickActionsProps {
  vaultInfo: VaultInfo | null;
  userVaultData: UserVaultData | null;
  isConnected: boolean;
}

export default function QuickActions({
  vaultInfo,
  userVaultData,
  isConnected,
}: QuickActionsProps) {
  const actions = [
    {
      name: 'Deposit',
      description: 'Add funds to the vault',
      href: '/vault?action=deposit',
      icon: PlusIcon,
      color: 'bg-green-500',
      disabled: !isConnected,
    },
    {
      name: 'Withdraw',
      description: 'Withdraw your funds',
      href: '/vault?action=withdraw',
      icon: MinusIcon,
      color: 'bg-red-500',
      disabled: !isConnected || !userVaultData || userVaultData.isLocked,
    },
    {
      name: 'Manage Strategies',
      description: 'Configure yield strategies',
      href: '/strategies',
      icon: CogIcon,
      color: 'bg-blue-500',
      disabled: false,
    },
  ];

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Quick Actions
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Common operations
        </p>
      </div>
      
      <div className="space-y-3">
        {actions.map((action) => (
          <Link
            key={action.name}
            to={action.href}
            className={`flex items-center p-3 rounded-lg border transition-colors ${
              action.disabled
                ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-50'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
            }`}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
              <action.icon className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3 flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {action.name}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {action.description}
              </div>
            </div>
            <ArrowRightIcon className="h-4 w-4 text-gray-400" />
          </Link>
        ))}
      </div>

      {/* Status info */}
      {isConnected && userVaultData && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {userVaultData.isLocked ? (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                Your funds are locked for security
              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                Your funds are available for withdrawal
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}