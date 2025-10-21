import { useState, useEffect } from "react";
import { ethers } from "ethers";

// Use the deployed contract address
const VAULT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Simple ABI for testing
const VAULT_ABI = [
  "function deposit() external payable",
  "function withdraw(uint256 amount) external", 
  "function getBalance(address user) external view returns (uint256)",
  "function getTotalBalance() external view returns (uint256)",
  "function emergencyWithdraw() external",
  "event Deposit(address indexed user, uint256 amount, uint256 timestamp)",
  "event Withdraw(address indexed user, uint256 amount, uint256 timestamp)"
];

export default function SimpleVaultTest() {
  const [amount, setAmount] = useState("1");
  const [balance, setBalance] = useState("0");
  const [walletBalance, setWalletBalance] = useState("0");
  const [isProcessing, setIsProcessing] = useState(false);
  const [account, setAccount] = useState<string>("");

  // Connect wallet and fetch balances
  async function connectWallet() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setAccount(address);
      await fetchBalances();
      
      console.log("✅ Wallet connected:", address);
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  }

  // Fetch vault and wallet balances
  async function fetchBalances() {
    try {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      // Get wallet balance
      const walletBal = await provider.getBalance(address);
      setWalletBalance(ethers.formatEther(walletBal));
      
      // Get vault balance
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      const vaultBal = await vault.getBalance(address);
      setBalance(ethers.formatEther(vaultBal));
      
      console.log("💰 Balances updated");
    } catch (error) {
      console.error("Balance fetch error:", error);
    }
  }

  // Deposit ETH into Vault
  async function handleDeposit() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        alert("Please enter a valid amount");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

      const value = ethers.parseEther(amount);
      console.log("💰 Depositing:", amount, "ETH");

      setIsProcessing(true);
      
      // Call deposit function (payable)
      const tx = await vault.deposit({ value });
      console.log("📤 Transaction sent:", tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      console.log("✅ Deposit confirmed");

      alert(`✅ Successfully deposited ${amount} ETH!`);
      setAmount("1");
      await fetchBalances();
    } catch (error) {
      console.error("❌ Deposit failed:", error);
      alert("Deposit failed - check console for details");
    } finally {
      setIsProcessing(false);
    }
  }

  // Withdraw ETH from Vault
  async function handleWithdraw() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        alert("Please enter a valid amount");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

      const value = ethers.parseEther(amount);
      console.log("💸 Withdrawing:", amount, "ETH");

      setIsProcessing(true);
      
      // Call withdraw function
      const tx = await vault.withdraw(value);
      console.log("📤 Transaction sent:", tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      console.log("✅ Withdraw confirmed");

      alert(`✅ Successfully withdrew ${amount} ETH!`);
      setAmount("1");
      await fetchBalances();
    } catch (error) {
      console.error("❌ Withdraw failed:", error);
      alert("Withdraw failed - check console for details");
    } finally {
      setIsProcessing(false);
    }
  }

  // Auto-connect on component mount
  useEffect(() => {
    if (window.ethereum) {
      connectWallet();
      
      // Listen for account changes
      window.ethereum.on("accountsChanged", () => {
        connectWallet();
      });
      
      // Listen for network changes
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">🏦 Simple Vault Test</h2>

      {/* Connection Status */}
      <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
        <p className="text-sm">
          <strong>Account:</strong> {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Not connected"}
        </p>
        <p className="text-sm">
          <strong>Contract:</strong> {VAULT_ADDRESS.slice(0, 6)}...{VAULT_ADDRESS.slice(-4)}
        </p>
      </div>

      {/* Balances */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between">
          <span>💰 Wallet Balance:</span>
          <span className="font-semibold">{parseFloat(walletBalance).toFixed(4)} ETH</span>
        </div>
        <div className="flex justify-between">
          <span>🏦 Vault Balance:</span>
          <span className="font-semibold">{parseFloat(balance).toFixed(4)} ETH</span>
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Amount (ETH)</label>
        <input
          type="number"
          step="0.001"
          placeholder="Enter amount in ETH"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleDeposit}
          disabled={isProcessing || !amount || parseFloat(amount) <= 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-md transition-colors"
        >
          {isProcessing ? "Processing..." : `Deposit ${amount} ETH`}
        </button>

        <button
          onClick={handleWithdraw}
          disabled={isProcessing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balance)}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-md transition-colors"
        >
          {isProcessing ? "Processing..." : `Withdraw ${amount} ETH`}
        </button>

        <button
          onClick={fetchBalances}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
        >
          🔄 Refresh Balances
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
        <p className="font-semibold mb-1">📋 Instructions:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Make sure MetaMask is on Hardhat Local (Chain ID: 31337)</li>
          <li>Use RPC: http://127.0.0.1:8545</li>
          <li>Import test account with private key from Hardhat node</li>
          <li>Enter amount and click Deposit/Withdraw</li>
          <li>Confirm transaction in MetaMask</li>
        </ol>
      </div>
    </div>
  );
}
