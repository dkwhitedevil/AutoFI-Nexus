import React from 'react';
import SimpleVaultTest from '../components/SimpleVaultTest';

export default function VaultTest() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            🧪 Vault Functionality Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Simple test interface for deposit and withdraw functions
          </p>
        </div>
        
        <SimpleVaultTest />
        
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">🔧 Setup Instructions</h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">1. Hardhat Node Running</p>
                <p className="text-yellow-700 dark:text-yellow-300">Make sure your Hardhat node is running: <code>npx hardhat node</code></p>
              </div>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <p className="font-semibold text-blue-800 dark:text-blue-200">2. MetaMask Network</p>
                <p className="text-blue-700 dark:text-blue-300">
                  Network: Hardhat Local<br/>
                  RPC URL: http://127.0.0.1:8545<br/>
                  Chain ID: 31337<br/>
                  Currency: ETH
                </p>
              </div>
              
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <p className="font-semibold text-green-800 dark:text-green-200">3. Import Test Account</p>
                <p className="text-green-700 dark:text-green-300">
                  Private Key: <code className="text-xs">0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80</code><br/>
                  This account has 10,000 test ETH
                </p>
              </div>
              
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                <p className="font-semibold text-purple-800 dark:text-purple-200">4. Contract Address</p>
                <p className="text-purple-700 dark:text-purple-300">
                  Vault: <code className="text-xs">0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512</code><br/>
                  Deployed on Hardhat Local Network
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
