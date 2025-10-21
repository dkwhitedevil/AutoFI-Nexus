import { useState, useEffect } from "react";
import { ethers } from "ethers";

// Use the deployed vault address
const VAULT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Simple ABI for the vault contract
const VAULT_ABI = [
  "function deposit() external payable",
  "function withdraw(uint256 amount) external", 
  "function getBalance(address user) external view returns (uint256)",
  "function getTotalBalance() external view returns (uint256)",
  "function emergencyWithdraw() external",
  "event Deposit(address indexed user, uint256 amount, uint256 timestamp)",
  "event Withdraw(address indexed user, uint256 amount, uint256 timestamp)"
];

export default function DirectVaultActions() {
  const [amount, setAmount] = useState("1");
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState("0");
  const [vaultBalance, setVaultBalance] = useState("0");
  const [account, setAccount] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      setAccount(accounts[0]);
      setIsConnected(true);
      await fetchBalances();
      
      console.log("✅ Wallet connected:", accounts[0]);
    } catch (error) {
      console.error("❌ Wallet connection failed:", error);
      alert("Failed to connect wallet");
    }
  };

  // Fetch balances
  const fetchBalances = async () => {
    try {
      if (!window.ethereum || !account) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Get wallet ETH balance
      const walletBal = await provider.getBalance(userAddress);
      setWalletBalance(ethers.formatEther(walletBal));
      
      // Get vault balance
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
      const vaultBal = await vault.getBalance(userAddress);
      setVaultBalance(ethers.formatEther(vaultBal));
      
      console.log("💰 Balances updated");
    } catch (error) {
      console.error("❌ Balance fetch error:", error);
    }
  };

  // Handle deposit - following your exact pattern
  const handleDeposit = async () => {
    try {
      if (!window.ethereum) {
        alert("Please connect MetaMask");
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        alert("Please enter a valid amount");
        return;
      }

      console.log("🚀 Starting deposit process...");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

      const value = ethers.parseEther(amount);
      console.log("💰 Depositing:", amount, "ETH");

      setLoading(true);

      // Call deposit function (payable) - your exact pattern
      const tx = await vault.deposit({ value });
      console.log("📤 Transaction sent:", tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      console.log("✅ Deposit confirmed");

      alert(`✅ Deposited ${amount} ETH successfully!`);
      setAmount("1");
      await fetchBalances();
      
    } catch (error) {
      console.error("❌ Deposit failed:", error);
      alert("Deposit failed - check console for details");
    } finally {
      setLoading(false);
    }
  };

  // Handle withdraw - following your exact pattern
  const handleWithdraw = async () => {
    try {
      if (!window.ethereum) {
        alert("Please connect MetaMask");
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        alert("Please enter a valid amount");
        return;
      }

      console.log("🚀 Starting withdraw process...");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

      const value = ethers.parseEther(amount);
      console.log("💸 Withdrawing:", amount, "ETH");

      setLoading(true);

      // Call withdraw function - your exact pattern
      const tx = await vault.withdraw(value);
      console.log("📤 Transaction sent:", tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      console.log("✅ Withdraw confirmed");

      alert(`✅ Withdrew ${amount} ETH successfully!`);
      setAmount("1");
      await fetchBalances();
      
    } catch (error) {
      console.error("❌ Withdraw failed:", error);
      alert("Withdraw failed - check console for details");
    } finally {
      setLoading(false);
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    if (window.ethereum) {
      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            fetchBalances();
          }
        });

      // Listen for account changes
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          fetchBalances();
        } else {
          setAccount("");
          setIsConnected(false);
        }
      });

      // Listen for network changes
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, [account]);

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
        🏦 Direct Vault Actions
      </h2>

      {/* Connection Status */}
      {!isConnected ? (
        <div className="text-center mb-6">
          <button
            onClick={connectWallet}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Connect MetaMask
          </button>
        </div>
      ) : (
        <div className="mb-6">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </p>
          </div>
        </div>
      )}

      {/* Balances */}
      {isConnected && (
        <div className="mb-6 space-y-2">
          <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">💰 Wallet:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {parseFloat(walletBalance).toFixed(4)} ETH
            </span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">🏦 Vault:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {parseFloat(vaultBalance).toFixed(4)} ETH
            </span>
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Amount (ETH)
        </label>
        <input
          type="number"
          step="0.001"
          placeholder="Enter amount in ETH"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={!isConnected}
        />
      </div>

      {/* Action Buttons - Following your exact pattern */}
      <div className="space-y-3">
        {/* Test button to verify clicks work */}
        <button
          onClick={() => {
            console.log("🧪 TEST: Button click detected!");
            alert("Button click works! ✅");
          }}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
        >
          🧪 Test Click (Debug)
        </button>
        
        <button
          onClick={handleDeposit}
          disabled={loading || !isConnected || !amount || parseFloat(amount) <= 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          {loading ? "Processing..." : `Deposit ${amount} ETH`}
        </button>

        <button
          onClick={handleWithdraw}
          disabled={loading || !isConnected || !amount || parseFloat(amount) <= 0}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          {loading ? "Processing..." : `Withdraw ${amount} ETH`}
        </button>

        <button
          onClick={fetchBalances}
          disabled={!isConnected}
          className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
        >
          🔄 Refresh Balances
        </button>
      </div>

      {/* Contract Info */}
      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>Contract:</strong> {VAULT_ADDRESS.slice(0, 10)}...{VAULT_ADDRESS.slice(-8)}
        </p>
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>Network:</strong> Hardhat Local (31337)
        </p>
      </div>
    </div>
  );
}
