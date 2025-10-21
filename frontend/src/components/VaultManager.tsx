import React, { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { 
  BanknotesIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Import the deployment info directly
import deploymentInfo from '../contracts/vault-deployment.json';
import { debugContract, logContractDebugInfo, testContractFunction } from '../utils/contractDebugger';

// Use environment variables if available, otherwise fallback to deployment info
const VAULT_CONTRACT_ADDRESS = import.meta.env.VITE_VAULT_CONTRACT_ADDRESS || deploymentInfo.contractAddress;
const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';
const vaultAbi = deploymentInfo.abi;

// Contract initialization
console.log('🏦 Vault Contract Address:', VAULT_CONTRACT_ADDRESS);
console.log('📋 Vault ABI loaded:', vaultAbi.length, 'functions');

interface Transaction {
  type: "Deposit" | "Withdraw";
  amount: string;
  txHash: string;
  timestamp: string;
}

export default function VaultManager() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  
  const [walletBalance, setWalletBalance] = useState("0.0000");
  const [vaultBalance, setVaultBalance] = useState("0.0000");
  const [totalVaultBalance, setTotalVaultBalance] = useState("0.0000");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("1");
  const [withdrawAmount, setWithdrawAmount] = useState("1");
  const [txHash, setTxHash] = useState<string | null>(null);
  
  const wallet = wallets[0];
  const isConnected = ready && authenticated && !!wallet;

  // Initialize ethers and contract
  const initializeContract = async () => {
    if (!wallet) {
      console.error('❌ No wallet available');
      return null;
    }
    
    if (!VAULT_CONTRACT_ADDRESS) {
      console.error('❌ No contract address available');
      return null;
    }
    
    try {
      // Use direct MetaMask provider for better compatibility
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const contract = new ethers.Contract(VAULT_CONTRACT_ADDRESS, vaultAbi, signer);
      console.log('✅ Contract initialized successfully');
      
      return contract;
    } catch (error) {
      console.error('❌ Failed to initialize contract:', error);
      return null;
    }
  };

  // Fetch all balances
  const fetchBalances = async () => {
    if (!wallet || !VAULT_CONTRACT_ADDRESS) {
      console.log('❌ Cannot fetch balances: missing wallet or contract address');
      return;
    }
    
    try {
      console.log('🔄 Fetching balances for wallet:', wallet.address);
      console.log('📍 Contract address:', VAULT_CONTRACT_ADDRESS);
      
      const provider = await wallet.getEthersProvider();
      const { ethers } = await import('ethers');
      
      // Validate wallet address format
      if (!ethers.isAddress(wallet.address)) {
        throw new Error(`Invalid wallet address format: ${wallet.address}`);
      }
      
      const contract = new ethers.Contract(VAULT_CONTRACT_ADDRESS, vaultAbi, provider as any);
      
      // Debug contract and network information
      const debugInfo = await debugContract(VAULT_CONTRACT_ADDRESS, wallet.address, provider);
      logContractDebugInfo(debugInfo);
      
      // If contract doesn't exist, show helpful error
      if (!debugInfo.contractExists) {
        throw new Error(`Contract not deployed at ${VAULT_CONTRACT_ADDRESS} on network ${debugInfo.networkName} (${debugInfo.networkId})`);
      }
      
      // Fetch wallet balance
      console.log('💰 Fetching wallet balance...');
      const rawWalletBalance = await provider.getBalance(wallet.address);
      const walletBalanceFormatted = parseFloat(ethers.formatEther(rawWalletBalance.toString())).toFixed(4);
      console.log('💰 Wallet balance:', walletBalanceFormatted, 'ETH');
      setWalletBalance(walletBalanceFormatted);
      
      // Test contract functions with debugging
      console.log('🧪 Testing contract functions...');
      
      // Test getTotalBalance first (should work even with no deposits)
      const totalBalanceTest = await testContractFunction(contract, 'getTotalBalance');
      if (totalBalanceTest.success) {
        const totalBalanceFormatted = parseFloat(ethers.formatEther(totalBalanceTest.result.toString())).toFixed(4);
        console.log('📊 Total vault balance:', totalBalanceFormatted, 'ETH');
        setTotalVaultBalance(totalBalanceFormatted);
      } else {
        console.error('❌ getTotalBalance failed:', totalBalanceTest.error);
        setTotalVaultBalance('0.0000');
      }
      
      // Test getBalance for user
      console.log('🏦 Fetching vault balance for address:', wallet.address);
      const userBalanceTest = await testContractFunction(contract, 'getBalance', [wallet.address]);
      if (userBalanceTest.success) {
        const vaultBalanceFormatted = parseFloat(ethers.formatEther(userBalanceTest.result.toString())).toFixed(4);
        console.log('🏦 Vault balance:', vaultBalanceFormatted, 'ETH');
        setVaultBalance(vaultBalanceFormatted);
      } else {
        console.error('❌ getBalance failed:', userBalanceTest.error);
        if (userBalanceTest.error?.includes('execution reverted')) {
          console.log('💡 Vault balance call reverted - user may not have deposited yet');
          setVaultBalance('0.0000');
        } else {
          setVaultBalance('0.0000');
        }
      }
      
      console.log('✅ Balance fetch completed successfully');
      
    } catch (error: any) {
      console.error('❌ Error fetching balances:', error);
      
      // Enhanced error handling
      if (error.message?.includes('execution reverted')) {
        if (error.message?.includes('require(false)')) {
          setError('❌ Contract call failed: Invalid address or contract not properly deployed');
        } else {
          setError('❌ Contract call failed: ' + (error.reason || 'Execution reverted'));
        }
      } else if (error.message?.includes('network')) {
        setError('❌ Network error: Please check your connection and network settings');
      } else if (error.message?.includes('Invalid wallet address')) {
        setError('❌ Invalid wallet address format');
      } else {
        setError('❌ Failed to fetch balances: ' + (error.message || 'Unknown error'));
      }
    }
  };

  // Listen for vault events and update balances
  useEffect(() => {
    if (!isConnected || !wallet || !VAULT_CONTRACT_ADDRESS) return;

    let contract: any;
    let provider: any;

    const setupListeners = async () => {
      try {
        provider = await wallet.getEthersProvider();
        const { ethers } = await import('ethers');
        contract = new ethers.Contract(VAULT_CONTRACT_ADDRESS, vaultAbi, provider as any);

        // Initial balance fetch
        await fetchBalances();

        // Listen for new blocks to update balances
        const handleNewBlock = () => {
          fetchBalances();
        };
        
        provider.on("block", handleNewBlock);

        // Listen for Vault events
        const handleDeposit = (user: string, amount: any, timestamp: any, event: any) => {
          if (user.toLowerCase() === wallet.address.toLowerCase()) {
            const tx: Transaction = {
              type: "Deposit",
              amount: ethers.formatEther(amount.toString()),
              txHash: event.log.transactionHash,
              timestamp: new Date(Number(timestamp) * 1000).toLocaleString()
            };
            setTransactions(prev => [tx, ...prev.slice(0, 9)]); // Keep last 10
          }
        };

        const handleWithdraw = (user: string, amount: any, timestamp: any, event: any) => {
          if (user.toLowerCase() === wallet.address.toLowerCase()) {
            const tx: Transaction = {
              type: "Withdraw", 
              amount: ethers.formatEther(amount.toString()),
              txHash: event.log.transactionHash,
              timestamp: new Date(Number(timestamp) * 1000).toLocaleString()
            };
            setTransactions(prev => [tx, ...prev.slice(0, 9)]); // Keep last 10
          }
        };

        contract.on("Deposit", handleDeposit);
        contract.on("Withdraw", handleWithdraw);

        return () => {
          if (provider) {
            provider.removeAllListeners("block");
          }
          if (contract) {
            contract.removeAllListeners("Deposit");
            contract.removeAllListeners("Withdraw");
          }
        };
      } catch (error) {
        console.error('Error setting up listeners:', error);
        setError('Failed to connect to vault contract');
      }
    };

    setupListeners();

    return () => {
      if (provider) {
        provider.removeAllListeners("block");
      }
      if (contract) {
        contract.removeAllListeners("Deposit");
        contract.removeAllListeners("Withdraw");
      }
    };
  }, [isConnected, wallet?.address]);

  // Helper function to set quick deposit amounts
  const setQuickDepositAmount = (percentage: number) => {
    const balance = parseFloat(walletBalance);
    const amount = (balance * percentage / 100).toFixed(4);
    setDepositAmount(amount);
  };

  // Helper function to set quick withdraw amounts
  const setQuickWithdrawAmount = (percentage: number) => {
    const balance = parseFloat(vaultBalance);
    const amount = (balance * percentage / 100).toFixed(4);
    setWithdrawAmount(amount);
  };

  // Helper function to clear transaction hash after delay
  const clearTxHashAfterDelay = () => {
    setTimeout(() => {
      setTxHash(null);
    }, 10000); // Clear after 10 seconds
  };

  // Deposit ETH to Vault
  const depositToVault = async () => {
    console.log('🔄 Deposit button clicked', { wallet: !!wallet, depositAmount, isLoading });
    
    // Validation checks
    if (!wallet) {
      setError('❌ Wallet not connected. Please connect your wallet first.');
      return;
    }
    
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('❌ Please enter a valid amount greater than 0');
      return;
    }

    // Check if user has sufficient balance
    const depositValue = parseFloat(depositAmount);
    const currentBalance = parseFloat(walletBalance);
    if (depositValue > currentBalance) {
      setError(`❌ Insufficient balance. You have ${currentBalance} ETH but trying to deposit ${depositValue} ETH`);
      return;
    }
    
    if (isLoading) {
      console.log('⏳ Already processing transaction...');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🏗️ Initializing contract...');
      const contract = await initializeContract();
      if (!contract) throw new Error('Failed to initialize contract');
      
      console.log('💰 Preparing deposit transaction...');
      const { ethers } = await import('ethers');
      const depositValueWei = ethers.parseEther(depositAmount.toString());
      console.log('💰 Deposit amount:', depositAmount, 'ETH =', depositValueWei.toString(), 'wei');
      
      // Estimate gas before sending transaction
      console.log('⛽ Estimating gas...');
      const gasEstimate = await contract.deposit.estimateGas({ 
        value: depositValueWei 
      });
      console.log('⛽ Estimated gas:', gasEstimate.toString());
      
      // Send transaction with gas limit
      const tx = await contract.deposit({ 
        value: depositValueWei
      });
      
      console.log("💰 Deposit transaction sent:", tx.hash);
      console.log("⏳ Waiting for confirmation...");
      
      // Set transaction hash for user feedback
      setTxHash(tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log("✅ Deposit confirmed in block:", receipt.blockNumber);
      console.log("⛽ Gas used:", receipt.gasUsed.toString());
      
      // Clear input and refresh balances
      setDepositAmount("1");
      await fetchBalances();
      
      // Success notification
      console.log(`🎉 Successfully deposited ${depositAmount} ETH to vault!`);
      clearTxHashAfterDelay();
      
    } catch (error: any) {
      console.error('❌ Deposit failed:', error);
      
      // Handle specific error types
      if (error.code === 'ACTION_REJECTED') {
        setError('❌ Transaction rejected by user');
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        setError('❌ Insufficient funds for transaction');
      } else if (error.message?.includes('execution reverted')) {
        setError('❌ Transaction failed: ' + (error.reason || 'Contract execution reverted'));
      } else {
        setError('❌ Deposit failed: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Withdraw ETH from Vault
  const withdrawFromVault = async () => {
    console.log('🔄 Withdraw button clicked', { wallet: !!wallet, withdrawAmount, isLoading, vaultBalance });
    
    // Validation checks
    if (!wallet) {
      setError('❌ Wallet not connected. Please connect your wallet first.');
      return;
    }
    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('❌ Please enter a valid amount greater than 0');
      return;
    }
    
    const withdrawValue = parseFloat(withdrawAmount);
    const currentVaultBalance = parseFloat(vaultBalance);
    
    if (withdrawValue > currentVaultBalance) {
      setError(`❌ Insufficient vault balance. You have ${currentVaultBalance} ETH in vault but trying to withdraw ${withdrawValue} ETH`);
      return;
    }
    
    if (currentVaultBalance === 0) {
      setError('❌ No funds in vault to withdraw');
      return;
    }
    
    if (isLoading) {
      console.log('⏳ Already processing transaction...');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🏗️ Initializing contract...');
      const contract = await initializeContract();
      if (!contract) throw new Error('Failed to initialize contract');
      
      console.log('💸 Preparing withdraw transaction...');
      const { ethers } = await import('ethers');
      const withdrawValueWei = ethers.parseEther(withdrawAmount.toString());
      console.log('💸 Withdraw amount:', withdrawAmount, 'ETH =', withdrawValueWei.toString(), 'wei');
      
      // Estimate gas before sending transaction
      console.log('⛽ Estimating gas...');
      const gasEstimate = await contract.withdraw.estimateGas(withdrawValueWei);
      console.log('⛽ Estimated gas:', gasEstimate.toString());
      
      // Send transaction
      const tx = await contract.withdraw(withdrawValueWei);
      
      console.log("💸 Withdraw transaction sent:", tx.hash);
      console.log("⏳ Waiting for confirmation...");
      
      // Set transaction hash for user feedback
      setTxHash(tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log("✅ Withdraw confirmed in block:", receipt.blockNumber);
      console.log("⛽ Gas used:", receipt.gasUsed.toString());
      
      // Clear input and refresh balances
      setWithdrawAmount("1");
      await fetchBalances();
      
      // Success notification
      console.log(`🎉 Successfully withdrew ${withdrawAmount} ETH from vault!`);
      clearTxHashAfterDelay();
      
    } catch (error: any) {
      console.error('❌ Withdraw failed:', error);
      
      // Handle specific error types
      if (error.code === 'ACTION_REJECTED') {
        setError('❌ Transaction rejected by user');
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        setError('❌ Insufficient funds for gas fees');
      } else if (error.message?.includes('Insufficient balance')) {
        setError('❌ Insufficient vault balance for withdrawal');
      } else if (error.message?.includes('execution reverted')) {
        setError('❌ Transaction failed: ' + (error.reason || 'Contract execution reverted'));
      } else {
        setError('❌ Withdraw failed: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Emergency withdraw all funds
  const emergencyWithdraw = async () => {
    console.log('🚨 Emergency withdraw button clicked', { wallet: !!wallet, isLoading, vaultBalance });
    
    if (!wallet) {
      setError('❌ Wallet not connected. Please connect your wallet first.');
      return;
    }
    
    const currentVaultBalance = parseFloat(vaultBalance);
    if (currentVaultBalance === 0) {
      setError('❌ No funds in vault to withdraw');
      return;
    }
    
    if (isLoading) {
      console.log('⏳ Already processing transaction...');
      return;
    }
    
    const confirmed = window.confirm(
      `⚠️ EMERGENCY WITHDRAW ⚠️\n\n` +
      `This will withdraw ALL ${vaultBalance} ETH from your vault.\n\n` +
      `Are you sure you want to continue?`
    );
    if (!confirmed) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🏗️ Initializing contract for emergency withdraw...');
      const contract = await initializeContract();
      if (!contract) throw new Error('Failed to initialize contract');
      
      console.log('🚨 Preparing emergency withdraw transaction...');
      
      // Estimate gas before sending transaction
      console.log('⛽ Estimating gas...');
      const gasEstimate = await contract.emergencyWithdraw.estimateGas();
      console.log('⛽ Estimated gas:', gasEstimate.toString());
      
      // Send transaction
      const tx = await contract.emergencyWithdraw();
      
      console.log("🚨 Emergency withdraw transaction sent:", tx.hash);
      console.log("⏳ Waiting for confirmation...");
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log("✅ Emergency withdraw confirmed in block:", receipt.blockNumber);
      console.log("⛽ Gas used:", receipt.gasUsed.toString());
      
      // Refresh balances
      await fetchBalances();
      
      // Success notification
      console.log(`🎉 Successfully withdrew all ${vaultBalance} ETH from vault!`);
      
    } catch (error: any) {
      console.error('❌ Emergency withdraw failed:', error);
      
      // Handle specific error types
      if (error.code === 'ACTION_REJECTED') {
        setError('❌ Emergency withdraw rejected by user');
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        setError('❌ Insufficient funds for gas fees');
      } else if (error.message?.includes('No balance to withdraw')) {
        setError('❌ No balance available for emergency withdraw');
      } else if (error.message?.includes('execution reverted')) {
        setError('❌ Emergency withdraw failed: ' + (error.reason || 'Contract execution reverted'));
      } else {
        setError('❌ Emergency withdraw failed: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!VAULT_CONTRACT_ADDRESS) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Vault Contract Not Deployed
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please deploy the Hardhat vault contract first.
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-left">
            <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
              cd hardhat-vault<br/>
              npx hardhat node<br/>
              npx hardhat run scripts/deploy.js --network localhost
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your wallet to access the AutoFi Nexus Vault
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vault Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <BanknotesIcon className="h-8 w-8" />
          <div>
            <h2 className="text-2xl font-bold">AutoFi Nexus Vault</h2>
            <p className="text-primary-100">Secure ETH deposits and withdrawals</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Transaction Status */}
      {txHash && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 dark:text-blue-300">
              Transaction submitted! Hash: 
              <span className="font-mono text-sm ml-1">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
            </span>
          </div>
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Wallet Balance</h3>
            <button
              onClick={fetchBalances}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {walletBalance} ETH
          </div>
        </div>

        {/* Vault Balance */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Your Vault Balance</h3>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {vaultBalance} ETH
          </div>
        </div>

        {/* Total Vault */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Total Vault TVL</h3>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {totalVaultBalance} ETH
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deposit */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ArrowUpIcon className="h-6 w-6 text-green-500" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Deposit ETH</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                step="0.0001"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="1.0"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setQuickDepositAmount(25)}
                  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-gray-700 dark:text-gray-300"
                >
                  25%
                </button>
                <button
                  onClick={() => setQuickDepositAmount(50)}
                  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-gray-700 dark:text-gray-300"
                >
                  50%
                </button>
                <button
                  onClick={() => setQuickDepositAmount(75)}
                  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-gray-700 dark:text-gray-300"
                >
                  75%
                </button>
                <button
                  onClick={() => setQuickDepositAmount(90)}
                  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-gray-700 dark:text-gray-300"
                >
                  Max
                </button>
              </div>
            </div>
            <button
              onClick={depositToVault}
              disabled={isLoading || !depositAmount || parseFloat(depositAmount) <= 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Depositing...' : `Deposit ${depositAmount} ETH`}
            </button>
          </div>
        </div>

        {/* Withdraw */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ArrowDownIcon className="h-6 w-6 text-blue-500" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Withdraw ETH</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                step="0.0001"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="1.0"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setQuickWithdrawAmount(25)}
                  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-gray-700 dark:text-gray-300"
                >
                  25%
                </button>
                <button
                  onClick={() => setQuickWithdrawAmount(50)}
                  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-gray-700 dark:text-gray-300"
                >
                  50%
                </button>
                <button
                  onClick={() => setQuickWithdrawAmount(75)}
                  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-gray-700 dark:text-gray-300"
                >
                  75%
                </button>
                <button
                  onClick={() => setQuickWithdrawAmount(100)}
                  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-gray-700 dark:text-gray-300"
                >
                  All
                </button>
              </div>
            </div>
            <button
              onClick={withdrawFromVault}
              disabled={isLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(vaultBalance)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Withdrawing...' : `Withdraw ${withdrawAmount} ETH`}
            </button>
            <button
              onClick={emergencyWithdraw}
              disabled={isLoading || parseFloat(vaultBalance) <= 0}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
            >
              Emergency Withdraw All
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <ClockIcon className="h-6 w-6 text-gray-500" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h3>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No transactions yet. Make your first deposit!
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  {tx.type === 'Deposit' ? (
                    <ArrowUpIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="h-5 w-5 text-blue-500" />
                  )}
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {tx.type} {parseFloat(tx.amount).toFixed(4)} ETH
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {tx.timestamp}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {tx.txHash.slice(0, 10)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
