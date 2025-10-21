import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { formatCurrency, isValidNumber } from '../../utils';
import { ERROR_MESSAGES } from '../../utils/constants';
import type { UserVaultData } from '../../types';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (shares: string) => Promise<void>;
  userVaultData: UserVaultData | null;
}

interface WithdrawForm {
  shares: string;
}

export default function WithdrawModal({
  isOpen,
  onClose,
  onWithdraw,
  userVaultData,
}: WithdrawModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<WithdrawForm>();

  const shares = watch('shares');

  const onSubmit = async (data: WithdrawForm) => {
    if (!userVaultData) return;

    setIsLoading(true);
    setError(null);

    try {
      const sharesNum = parseFloat(data.shares);
      
      if (sharesNum > parseFloat(userVaultData.shares)) {
        setError('Insufficient shares');
        return;
      }

      await onWithdraw(data.shares);
      reset();
      onClose();
    } catch (err: any) {
      setError(err.message || ERROR_MESSAGES.TRANSACTION_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Withdraw Funds
            </h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Shares to Withdraw
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...register('shares', {
                    required: 'Shares amount is required',
                    validate: (value) => {
                      if (!isValidNumber(value)) {
                        return 'Please enter a valid number';
                      }
                      const num = parseFloat(value);
                      if (num <= 0) {
                        return 'Amount must be greater than 0';
                      }
                      return true;
                    },
                  })}
                  className="input pr-12"
                  placeholder="0.00"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Shares</span>
                </div>
              </div>
              {errors.shares && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.shares.message}
                </p>
              )}
            </div>

            {/* Withdrawal info */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between mb-1">
                  <span>Available shares:</span>
                  <span>{userVaultData ? formatCurrency(userVaultData.shares) : '0'}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Status:</span>
                  <span className={userVaultData?.isLocked ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}>
                    {userVaultData?.isLocked ? 'Locked' : 'Available'}
                  </span>
                </div>
                {shares && isValidNumber(shares) && (
                  <div className="flex justify-between font-medium text-gray-900 dark:text-gray-100">
                    <span>You will receive:</span>
                    <span>{formatCurrency(shares)} USDC</span>
                  </div>
                )}
              </div>
            </div>

            {/* Lock warning */}
            {userVaultData?.isLocked && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Your funds are currently locked. Withdrawals will be available after the lock period ends.
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !shares || !!errors.shares || userVaultData?.isLocked}
                className="btn-primary flex-1 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Withdrawing...
                  </>
                ) : (
                  'Withdraw'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}