import { ethers } from 'ethers';

export interface BalanceDebugInfo {
  walletAddress: string;
  networkId: number;
  networkName: string;
  hasMetaMask: boolean;
  isConnected: boolean;
  ethBalance: string;
  contractExists: boolean;
  contractAddress: string;
}

export async function debugBalanceFetch(): Promise<BalanceDebugInfo> {
  const debugInfo: Partial<BalanceDebugInfo> = {};

  try {
    // Check MetaMask availability
    debugInfo.hasMetaMask = !!window.ethereum;
    
    if (!window.ethereum) {
      throw new Error('MetaMask not available');
    }

    // Initialize provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Get network info
    const network = await provider.getNetwork();
    debugInfo.networkId = Number(network.chainId);
    debugInfo.networkName = network.name || 'unknown';

    // Get wallet address
    try {
      const signer = await provider.getSigner();
      debugInfo.walletAddress = await signer.getAddress();
      debugInfo.isConnected = true;

      // Get ETH balance
      const balance = await provider.getBalance(debugInfo.walletAddress);
      debugInfo.ethBalance = ethers.formatEther(balance);
    } catch (signerError) {
      debugInfo.isConnected = false;
      debugInfo.walletAddress = 'Not connected';
      debugInfo.ethBalance = '0';
    }

    // Check contract existence (using ETH vault address)
    const contractAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
    debugInfo.contractAddress = contractAddress;
    
    try {
      const code = await provider.getCode(contractAddress);
      debugInfo.contractExists = code !== '0x';
    } catch (contractError) {
      debugInfo.contractExists = false;
    }

    return debugInfo as BalanceDebugInfo;
  } catch (error) {
    console.error('Debug balance fetch failed:', error);
    throw error;
  }
}

export function logBalanceDebugInfo(info: BalanceDebugInfo) {
  console.group('🔍 Balance Fetch Debug Information');
  console.log('🦊 MetaMask Available:', info.hasMetaMask);
  console.log('🔗 Connected:', info.isConnected);
  console.log('👤 Wallet Address:', info.walletAddress);
  console.log('🌐 Network ID:', info.networkId);
  console.log('🌐 Network Name:', info.networkName);
  console.log('💰 ETH Balance:', info.ethBalance, 'ETH');
  console.log('📄 Contract Address:', info.contractAddress);
  console.log('✅ Contract Exists:', info.contractExists);
  
  // Provide troubleshooting suggestions
  if (!info.hasMetaMask) {
    console.warn('⚠️ MetaMask not detected!');
    console.log('💡 Solution: Install MetaMask browser extension');
  }
  
  if (!info.isConnected) {
    console.warn('⚠️ Wallet not connected!');
    console.log('💡 Solution: Click "Connect MetaMask" button');
  }
  
  if (info.networkId !== 31337) {
    console.warn('⚠️ Wrong network detected!');
    console.log('💡 Solution: Switch to Hardhat Local network (Chain ID: 31337)');
  }
  
  if (!info.contractExists) {
    console.warn('⚠️ Contract not found at address!');
    console.log('💡 Solution: Deploy the vault contract first');
    console.log('💡 Commands:');
    console.log('   cd hardhat-vault');
    console.log('   npx hardhat node');
    console.log('   npx hardhat run scripts/deploy.js --network localhost');
  }
  
  console.groupEnd();
}

// Quick debug function to call from browser console
(window as any).debugBalance = async () => {
  try {
    const info = await debugBalanceFetch();
    logBalanceDebugInfo(info);
    return info;
  } catch (error) {
    console.error('Debug failed:', error);
    return null;
  }
};
