import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACTS, ABIS, areContractsDeployed } from "../config/contracts";
import { debugBalanceFetch, logBalanceDebugInfo } from "../utils/balanceDebugger";

interface Balances {
  wallet: string;
  vault: string;
  allowance: string;
}

export default function VaultActions() {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [vaultType, setVaultType] = useState<"ETH" | "ERC20">("ETH");
  const [balances, setBalances] = useState<Balances>({
    wallet: "0",
    vault: "0",
    allowance: "0"
  });
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState("");

  const contractsStatus = areContractsDeployed();

  const connect = async (): Promise<ethers.Signer | null> => {
    if (!window.ethereum) {
      setStatus("❌ Please install MetaMask to continue");
      return null;
    }
    
    try {
      setStatus("🔄 Connecting to MetaMask...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setAccount(address);
      setIsConnected(true);
      setStatus("✅ Successfully connected to MetaMask");
      await fetchBalances(signer);
      
      return signer;
    } catch (error: any) {
      console.error("Connection failed:", error);
      
      // Handle specific MetaMask errors
      if (error.code === 4001 || error.message?.includes('User rejected') || error.message?.includes('rejected the request')) {
        setStatus("⚠️ Connection cancelled. Please approve the MetaMask request to continue.");
      } else if (error.code === -32002) {
        setStatus("⚠️ MetaMask is already processing a request. Please check your MetaMask extension.");
      } else if (error.message?.includes('network')) {
        setStatus("❌ Network error. Please check your internet connection and try again.");
      } else {
        setStatus("❌ Connection failed: " + (error.message || 'Unknown error'));
      }
      
      return null;
    }
  };

  const fetchBalances = async (signer: ethers.Signer | null = null) => {
    console.log('🔄 Starting balance fetch...', { 
      signer: !!signer, 
      isConnected, 
      vaultType, 
      account 
    });

    try {
      // Validation checks
      if (!signer && !isConnected) {
        console.log('❌ No signer and not connected, skipping balance fetch');
        return;
      }

      if (!window.ethereum) {
        setStatus("❌ MetaMask not detected. Please install MetaMask.");
        return;
      }

      // Initialize provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const currentSigner = signer || await provider.getSigner();
      const address = await currentSigner.getAddress();

      console.log('📍 Fetching balances for address:', address);
      console.log('🏦 Vault type:', vaultType);

      // Check network
      const network = await provider.getNetwork();
      console.log('🌐 Connected to network:', network.chainId, network.name);
      
      if (Number(network.chainId) !== CONTRACTS.NETWORK.chainId) {
        setStatus(`❌ Wrong network. Please switch to ${CONTRACTS.NETWORK.name} (Chain ID: ${CONTRACTS.NETWORK.chainId})`);
        return;
      }

      if (vaultType === "ETH") {
        console.log('💰 Fetching ETH vault balances...');
        
        // Check if ETH vault is deployed
        if (!contractsStatus.ethVault) {
          setStatus("❌ ETH Vault not deployed. Please deploy the contract first.");
          return;
        }

        // Fetch wallet ETH balance
        console.log('💰 Getting wallet ETH balance...');
        const walletBalance = await provider.getBalance(address);
        console.log('💰 Wallet balance (wei):', walletBalance.toString());

        // Fetch vault balance with error handling
        console.log('🏦 Getting vault balance...');
        const vault = new ethers.Contract(CONTRACTS.ETH_VAULT, ABIS.ETH_VAULT, currentSigner);
        
        let vaultBalance;
        try {
          vaultBalance = await vault.getBalance(address);
          console.log('🏦 Vault balance (wei):', vaultBalance.toString());
        } catch (vaultError: any) {
          console.error('❌ Vault balance fetch failed:', vaultError);
          if (vaultError.message?.includes('execution reverted')) {
            console.log('💡 Vault balance reverted - user may not have deposited yet');
            vaultBalance = ethers.parseEther("0");
          } else {
            throw vaultError;
          }
        }
        
        const formattedBalances = {
          wallet: ethers.formatEther(walletBalance),
          vault: ethers.formatEther(vaultBalance),
          allowance: "N/A" // Not applicable for ETH
        };

        console.log('✅ ETH balances formatted:', formattedBalances);
        setBalances(formattedBalances);
        setStatus("✅ Balances updated successfully");

      } else if (vaultType === "ERC20") {
        console.log('🪙 Fetching ERC20 vault balances...');
        
        // Check if ERC20 contracts are deployed
        if (!contractsStatus.usdc) {
          setStatus("❌ USDC token not deployed. Please deploy the USDC contract first.");
          return;
        }
        
        if (!contractsStatus.erc20Vault) {
          setStatus("❌ ERC20 Vault not deployed. Please deploy the ERC20 vault contract first.");
          return;
        }

        // Initialize contracts
        const token = new ethers.Contract(CONTRACTS.USDC, ABIS.ERC20, currentSigner);
        const vault = new ethers.Contract(CONTRACTS.ERC20_VAULT, ABIS.ERC20_VAULT, currentSigner);
        
        console.log('🪙 Getting USDC wallet balance...');
        const walletBalance = await token.balanceOf(address);
        console.log('🪙 USDC wallet balance (raw):', walletBalance.toString());

        console.log('🏦 Getting ERC20 vault balance...');
        let vaultBalance;
        try {
          vaultBalance = await vault.getBalance(address);
          console.log('🏦 ERC20 vault balance (raw):', vaultBalance.toString());
        } catch (vaultError: any) {
          console.error('❌ ERC20 vault balance fetch failed:', vaultError);
          if (vaultError.message?.includes('execution reverted')) {
            console.log('💡 ERC20 vault balance reverted - user may not have deposited yet');
            vaultBalance = ethers.parseUnits("0", 6);
          } else {
            throw vaultError;
          }
        }

        console.log('🔒 Getting allowance...');
        const allowance = await token.allowance(address, CONTRACTS.ERC20_VAULT);
        console.log('🔒 Allowance (raw):', allowance.toString());
        
        const formattedBalances = {
          wallet: ethers.formatUnits(walletBalance, 6), // USDC has 6 decimals
          vault: ethers.formatUnits(vaultBalance, 6),
          allowance: ethers.formatUnits(allowance, 6)
        };

        console.log('✅ ERC20 balances formatted:', formattedBalances);
        setBalances(formattedBalances);
        setStatus("✅ Balances updated successfully");
      }

    } catch (error: any) {
      console.error("❌ Balance fetch failed:", error);
      
      // Enhanced error handling
      if (error.code === 4001 || error.message?.includes('User rejected')) {
        setStatus("⚠️ User cancelled the request. Please approve to fetch balances.");
      } else if (error.message?.includes('execution reverted')) {
        setStatus("❌ Contract call failed. Please check if contracts are deployed correctly.");
      } else if (error.message?.includes('network')) {
        setStatus("❌ Network error. Please check your connection and try again.");
      } else if (error.message?.includes('provider')) {
        setStatus("❌ Provider error. Please refresh the page and try again.");
      } else {
        setStatus("❌ Failed to fetch balances: " + (error.message || 'Unknown error'));
      }
    }
  };

  // ETH Vault Deposit
  const handleETHDeposit = async () => {
    try {
      const signer = await connect();
      if (!signer) return;

      setStatus("💰 Depositing ETH...");

      const vault = new ethers.Contract(CONTRACTS.ETH_VAULT, ABIS.ETH_VAULT, signer);
      const value = ethers.parseEther(amount);

      const tx = await vault.deposit({ value });
      setStatus("⏳ Transaction submitted. Waiting for confirmation...");
      await tx.wait();

      setStatus("✅ ETH Deposit successful!");
      await fetchBalances(signer);
      setAmount("");
    } catch (error: any) {
      console.error(error);
      
      // Handle specific transaction errors
      if (error.code === 4001 || error.message?.includes('User rejected') || error.message?.includes('rejected the request')) {
        setStatus("⚠️ Transaction cancelled. Please approve the transaction to continue.");
      } else if (error.message?.includes('insufficient funds')) {
        setStatus("❌ Insufficient funds for this transaction.");
      } else if (error.message?.includes('gas')) {
        setStatus("❌ Transaction failed due to gas issues. Please try again.");
      } else {
        setStatus("❌ ETH Deposit failed: " + (error.message || 'Unknown error'));
      }
    }
  };

  // ETH Vault Withdraw
  const handleETHWithdraw = async () => {
    try {
      const signer = await connect();
      if (!signer) return;

      setStatus("💸 Withdrawing ETH...");

      const vault = new ethers.Contract(CONTRACTS.ETH_VAULT, ABIS.ETH_VAULT, signer);
      const value = ethers.parseEther(amount);

      const tx = await vault.withdraw(value);
      setStatus("⏳ Transaction submitted. Waiting for confirmation...");
      await tx.wait();

      setStatus("✅ ETH Withdrawal successful!");
      await fetchBalances(signer);
      setAmount("");
    } catch (error: any) {
      console.error(error);
      
      // Handle specific transaction errors
      if (error.code === 4001 || error.message?.includes('User rejected') || error.message?.includes('rejected the request')) {
        setStatus("⚠️ Transaction cancelled. Please approve the transaction to continue.");
      } else if (error.message?.includes('insufficient funds')) {
        setStatus("❌ Insufficient vault balance for this withdrawal.");
      } else if (error.message?.includes('gas')) {
        setStatus("❌ Transaction failed due to gas issues. Please try again.");
      } else {
        setStatus("❌ ETH Withdraw failed: " + (error.message || 'Unknown error'));
      }
    }
  };

  // ERC20 Vault Deposit (your exact pattern)
  const handleERC20Deposit = async () => {
    try {
      const signer = await connect();
      if (!signer) return;

      setStatus("⏳ Approving USDC...");

      const token = new ethers.Contract(CONTRACTS.USDC, ABIS.ERC20, signer);
      const vault = new ethers.Contract(CONTRACTS.ERC20_VAULT, ABIS.ERC20_VAULT, signer);

      const parsedAmount = ethers.parseUnits(amount, 6); // 6 decimals for USDC

      // 1️⃣ Approve
      const tx1 = await token.approve(CONTRACTS.ERC20_VAULT, parsedAmount);
      setStatus("⏳ Approval submitted. Waiting for confirmation...");
      await tx1.wait();

      setStatus("💰 Depositing USDC...");

      // 2️⃣ Deposit
      const tx2 = await vault.deposit(parsedAmount);
      setStatus("⏳ Deposit submitted. Waiting for confirmation...");
      await tx2.wait();

      setStatus("✅ USDC Deposit successful!");
      await fetchBalances(signer);
      setAmount("");
    } catch (error: any) {
      console.error(error);
      
      // Handle specific transaction errors
      if (error.code === 4001 || error.message?.includes('User rejected') || error.message?.includes('rejected the request')) {
        setStatus("⚠️ Transaction cancelled. Please approve both the approval and deposit transactions.");
      } else if (error.message?.includes('insufficient funds') || error.message?.includes('insufficient balance')) {
        setStatus("❌ Insufficient USDC balance for this transaction.");
      } else if (error.message?.includes('gas')) {
        setStatus("❌ Transaction failed due to gas issues. Please try again.");
      } else {
        setStatus("❌ USDC Deposit failed: " + (error.message || 'Unknown error'));
      }
    }
  };

  // ERC20 Vault Withdraw (your exact pattern)
  const handleERC20Withdraw = async () => {
    try {
      const signer = await connect();
      if (!signer) return;

      setStatus("💸 Withdrawing USDC...");

      const vault = new ethers.Contract(CONTRACTS.ERC20_VAULT, ABIS.ERC20_VAULT, signer);
      const parsedShares = ethers.parseUnits(amount, 6); // assuming 1:1 shares

      const tx = await vault.withdraw(parsedShares);
      setStatus("⏳ Withdrawal submitted. Waiting for confirmation...");
      await tx.wait();

      setStatus("✅ USDC Withdrawal successful!");
      await fetchBalances(signer);
      setAmount("");
    } catch (error: any) {
      console.error(error);
      
      // Handle specific transaction errors
      if (error.code === 4001 || error.message?.includes('User rejected') || error.message?.includes('rejected the request')) {
        setStatus("⚠️ Transaction cancelled. Please approve the withdrawal transaction.");
      } else if (error.message?.includes('insufficient funds') || error.message?.includes('insufficient balance')) {
        setStatus("❌ Insufficient vault balance for this withdrawal.");
      } else if (error.message?.includes('gas')) {
        setStatus("❌ Transaction failed due to gas issues. Please try again.");
      } else {
        setStatus("❌ USDC Withdraw failed: " + (error.message || 'Unknown error'));
      }
    }
  };

  // Auto-fetch balances when vault type changes
  useEffect(() => {
    if (isConnected) {
      fetchBalances();
    }
  }, [vaultType, isConnected]);

  // Auto-connect on mount
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            connect();
          }
        })
        .catch((error: any) => {
          // Silently handle auto-connect errors to avoid spamming user
          console.log('Auto-connect failed:', error);
        });
    }
  }, []);

  return (
    <div className="bg-gray-900 text-white p-6 rounded-2xl max-w-md mx-auto shadow-xl">
      <h2 className="text-2xl font-bold mb-4 text-center">AutoFi Vault</h2>

      {/* Connection Status */}
      {!isConnected ? (
        <button
          onClick={connect}
          className="w-full bg-blue-500 hover:bg-blue-600 p-3 rounded mb-4 font-semibold"
        >
          Connect MetaMask
        </button>
      ) : (
        <div className="mb-4 p-2 bg-green-800 rounded text-center text-sm">
          ✅ Connected: {account.slice(0, 6)}...{account.slice(-4)}
        </div>
      )}

      {/* Vault Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Vault Type:</label>
        <div className="flex gap-2">
          <button
            onClick={() => setVaultType("ETH")}
            className={`flex-1 p-2 rounded ${vaultType === "ETH" ? "bg-blue-600" : "bg-gray-700"}`}
          >
            ETH Vault
          </button>
          <button
            onClick={() => setVaultType("ERC20")}
            disabled={!contractsStatus.erc20Vault}
            className={`flex-1 p-2 rounded ${vaultType === "ERC20" ? "bg-blue-600" : "bg-gray-700"} ${!contractsStatus.erc20Vault ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            USDC Vault
          </button>
        </div>
      </div>

      {/* Balances Display */}
      {isConnected && (
        <div className="mb-4 space-y-2 text-sm">
          <div className="flex justify-between p-2 bg-gray-800 rounded">
            <span>💰 Wallet:</span>
            <span>{parseFloat(balances.wallet).toFixed(4)} {vaultType === "ETH" ? "ETH" : "USDC"}</span>
          </div>
          <div className="flex justify-between p-2 bg-gray-800 rounded">
            <span>🏦 Vault:</span>
            <span>{parseFloat(balances.vault).toFixed(4)} {vaultType === "ETH" ? "ETH" : "USDC"}</span>
          </div>
          {vaultType === "ERC20" && (
            <div className="flex justify-between p-2 bg-gray-800 rounded">
              <span>✅ Allowance:</span>
              <span>{parseFloat(balances.allowance).toFixed(4)} USDC</span>
            </div>
          )}
        </div>
      )}

      {/* Amount Input */}
      <input
        type="number"
        placeholder={`Enter amount (${vaultType === "ETH" ? "ETH" : "USDC"})`}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full p-3 rounded text-black mb-4 border-2 border-gray-600 focus:border-blue-500"
        disabled={!isConnected}
      />

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={vaultType === "ETH" ? handleETHDeposit : handleERC20Deposit}
          disabled={!isConnected || !amount}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 p-3 rounded font-semibold transition-colors"
        >
          Deposit {amount} {vaultType === "ETH" ? "ETH" : "USDC"}
        </button>

        <button
          onClick={vaultType === "ETH" ? handleETHWithdraw : handleERC20Withdraw}
          disabled={!isConnected || !amount}
          className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-600 p-3 rounded font-semibold transition-colors"
        >
          Withdraw {amount} {vaultType === "ETH" ? "ETH" : "USDC"}
        </button>

        <button
          onClick={() => fetchBalances()}
          disabled={!isConnected}
          className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 p-2 rounded text-sm transition-colors"
        >
          🔄 Refresh Balances
        </button>

        <button
          onClick={async () => {
            try {
              const debugInfo = await debugBalanceFetch();
              logBalanceDebugInfo(debugInfo);
              setStatus("🔍 Debug info logged to console. Press F12 to view.");
            } catch (error: any) {
              setStatus("❌ Debug failed: " + error.message);
            }
          }}
          className="w-full bg-purple-600 hover:bg-purple-700 p-2 rounded text-sm transition-colors mt-2"
        >
          🔍 Debug Balance Issues
        </button>
      </div>

      {/* Status Display */}
      {status && (
        <div className="mt-4 p-3 bg-gray-800 rounded text-center text-sm">
          {status}
        </div>
      )}

      {/* Contract Status */}
      <div className="mt-4 text-xs text-gray-400">
        <div className="grid grid-cols-2 gap-1">
          <div>ETH Vault: {contractsStatus.ethVault ? "✅" : "❌"}</div>
          <div>USDC: {contractsStatus.usdc ? "✅" : "❌"}</div>
          <div>AUTO: {contractsStatus.auto ? "✅" : "❌"}</div>
          <div>ERC20 Vault: {contractsStatus.erc20Vault ? "✅" : "❌"}</div>
        </div>
      </div>

      {/* Contract Addresses */}
      <div className="mt-2 text-xs text-gray-500">
        <div>ETH Vault: {CONTRACTS.ETH_VAULT.slice(0, 10)}...{CONTRACTS.ETH_VAULT.slice(-6)}</div>
        {contractsStatus.erc20Vault && (
          <div>ERC20 Vault: {CONTRACTS.ERC20_VAULT.slice(0, 10)}...{CONTRACTS.ERC20_VAULT.slice(-6)}</div>
        )}
      </div>
    </div>
  );
}
