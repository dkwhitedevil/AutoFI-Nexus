import React from 'react';
import { usePrivyContext } from '../contexts/PrivyContext';
import ErrorDisplay from './ErrorDisplay';

export default function WalletConnection() {
  const { isConnected, isConnecting, user, wallet, connectWallet, disconnectWallet, error } = usePrivyContext();

  const handleConnect = async () => {
    await connectWallet();
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
  };

  if (isConnecting) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-white">Connecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <ErrorDisplay error={error} />
      
      {!isConnected ? (
        <div className="text-center">
          <p className="text-gray-300 mb-4">Connect your wallet to get started</p>
          <button
            onClick={handleConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-4">
            <p className="text-green-400 mb-2">✅ Wallet Connected</p>
            {user?.email && (
              <p className="text-gray-300 text-sm">Email: {user.email}</p>
            )}
            {wallet?.address && (
              <p className="text-gray-300 text-sm">
                Address: {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </p>
            )}
          </div>
          <button
            onClick={handleDisconnect}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
