import { ethers } from 'ethers';

export interface ContractDebugInfo {
  contractAddress: string;
  networkId: number;
  networkName: string;
  walletAddress: string;
  isValidAddress: boolean;
  contractExists: boolean;
  contractCode: string;
}

export async function debugContract(
  contractAddress: string,
  walletAddress: string,
  provider: any
): Promise<ContractDebugInfo> {
  try {
    const network = await provider.getNetwork();
    const code = await provider.getCode(contractAddress);
    
    return {
      contractAddress,
      networkId: Number(network.chainId),
      networkName: network.name || 'unknown',
      walletAddress,
      isValidAddress: ethers.isAddress(walletAddress),
      contractExists: code !== '0x',
      contractCode: code,
    };
  } catch (error) {
    console.error('Contract debug error:', error);
    throw error;
  }
}

export function logContractDebugInfo(info: ContractDebugInfo) {
  console.group('🔍 Contract Debug Information');
  console.log('📍 Contract Address:', info.contractAddress);
  console.log('🌐 Network ID:', info.networkId);
  console.log('🌐 Network Name:', info.networkName);
  console.log('👤 Wallet Address:', info.walletAddress);
  console.log('✅ Valid Address:', info.isValidAddress);
  console.log('📄 Contract Exists:', info.contractExists);
  console.log('📝 Contract Code Length:', info.contractCode.length);
  
  if (!info.contractExists) {
    console.warn('⚠️ Contract not found at this address on this network!');
    console.log('💡 Possible solutions:');
    console.log('  - Check if the contract is deployed on the correct network');
    console.log('  - Verify the contract address is correct');
    console.log('  - Ensure you are connected to the right network');
  }
  
  if (!info.isValidAddress) {
    console.error('❌ Invalid wallet address format!');
  }
  
  console.groupEnd();
}

export async function testContractFunction(
  contract: ethers.Contract,
  functionName: string,
  args: any[] = []
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    console.log(`🧪 Testing contract function: ${functionName}(${args.join(', ')})`);
    const result = await contract[functionName](...args);
    console.log(`✅ Function ${functionName} succeeded:`, result);
    return { success: true, result };
  } catch (error: any) {
    console.error(`❌ Function ${functionName} failed:`, error);
    return { 
      success: false, 
      error: error.message || 'Unknown error',
    };
  }
}
