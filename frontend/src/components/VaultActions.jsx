import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACTS, ABIS, areContractsDeployed } from "../config/contracts";

export default function VaultActions() {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [vaultType, setVaultType] = useState("ETH"); // ETH or ERC20
  const [balances, setBalances] = useState({
    wallet: "0",
    vault: "0",
    allowance: "0"
  });
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState("");

  const contractsStatus = areContractsDeployed();

  const connect = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return null;
    }
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setAccount(address);
      setIsConnected(true);
      await fetchBalances(signer);
      
      return signer;
    } catch (error) {
      console.error("Connection failed:", error);
      setStatus("❌ Connection failed: " + error.message);
      return null;
    }
  };

  const fetchBalances = async (signer = null) => {
    try {
      if (!signer && !isConnected) return;
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const currentSigner = signer || await provider.getSigner();
      const address = await currentSigner.getAddress();

      if (vaultType === "ETH") {
        // ETH Vault balances
        const walletBalance = await provider.getBalance(address);
        const vault = new ethers.Contract(CONTRACTS.ETH_VAULT, ABIS.ETH_VAULT, currentSigner);
        const vaultBalance = await vault.getBalance(address);
        
        setBalances({
          wallet: ethers.formatEther(walletBalance),
          vault: ethers.formatEther(vaultBalance),
          allowance: "N/A" // Not applicable for ETH
        });
      } else if (contractsStatus.usdc && contractsStatus.erc20Vault) {
        // ERC20 (USDC) balances
        const token = new ethers.Contract(CONTRACTS.USDC, ABIS.ERC20, currentSigner);
        const vault = new ethers.Contract(CONTRACTS.ERC20_VAULT, ABIS.ERC20_VAULT, currentSigner);
        
        const walletBalance = await token.balanceOf(address);
        const vaultBalance = await vault.getBalance(address);
        const allowance = await token.allowance(address, CONTRACTS.ERC20_VAULT);
        
        setBalances({
          wallet: ethers.formatUnits(walletBalance, 6), // USDC has 6 decimals
          vault: ethers.formatUnits(vaultBalance, 6),
          allowance: ethers.formatUnits(allowance, 6)
        });
      }
    } catch (error) {
      console.error("Balance fetch failed:", error);
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
      await tx.wait();

      setStatus("✅ ETH Deposit successful!");
      await fetchBalances(signer);
      setAmount("");
    } catch (error) {
      console.error(error);
      setStatus("❌ ETH Deposit failed: " + error.message);
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
      await tx.wait();

      setStatus("✅ ETH Withdrawal successful!");
      await fetchBalances(signer);
      setAmount("");
    } catch (error) {
      console.error(error);
      setStatus("❌ ETH Withdraw failed: " + error.message);
    }
  };

  // ERC20 Vault Deposit (your exact pattern)
  const handleERC20Deposit = async () => {
    try {
      const signer = await connect();
      if (!signer) return;

      setStatus("⏳ Approving...");

      const token = new ethers.Contract(CONTRACTS.USDC, ABIS.ERC20, signer);
      const vault = new ethers.Contract(CONTRACTS.ERC20_VAULT, ABIS.ERC20_VAULT, signer);

      const parsedAmount = ethers.parseUnits(amount, 6); // 6 decimals for USDC

      // 1️⃣ Approve
      const tx1 = await token.approve(CONTRACTS.ERC20_VAULT, parsedAmount);
      await tx1.wait();

      setStatus("💰 Depositing...");

      // 2️⃣ Deposit
      const tx2 = await vault.deposit(parsedAmount);
      await tx2.wait();

      setStatus("✅ Deposit successful!");
      await fetchBalances(signer);
      setAmount("");
    } catch (error) {
      console.error(error);
      setStatus("❌ Deposit failed: " + error.message);
    }
  };

  // ERC20 Vault Withdraw (your exact pattern)
  const handleERC20Withdraw = async () => {
    try {
      const signer = await connect();
      if (!signer) return;

      setStatus("💸 Withdrawing...");

      const vault = new ethers.Contract(CONTRACTS.ERC20_VAULT, ABIS.ERC20_VAULT, signer);
      const parsedShares = ethers.parseUnits(amount, 6); // assuming 1:1 shares

      const tx = await vault.withdraw(parsedShares);
      await tx.wait();

      setStatus("✅ Withdrawal successful!");
      await fetchBalances(signer);
      setAmount("");
    } catch (error) {
      console.error(error);
      setStatus("❌ Withdraw failed: " + error.message);
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
        .then((accounts) => {
          if (accounts.length > 0) {
            connect();
          }
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
