// Contract addresses for AutoFi Nexus
// Update these addresses after deployment

export interface ContractAddresses {
  ETH_VAULT: string;
  USDC: string;
  AUTO: string;
  ERC20_VAULT: string;
  NETWORK: {
    chainId: number;
    name: string;
    rpcUrl: string;
  };
}

export interface ContractStatus {
  ethVault: boolean;
  usdc: boolean;
  auto: boolean;
  erc20Vault: boolean;
}

export const CONTRACTS: ContractAddresses = {
  // Current ETH Vault (deployed)
  ETH_VAULT: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  
  // ERC20 Token addresses (to be deployed)
  USDC: "0x0000000000000000000000000000000000000000", // Update after USDC deployment
  AUTO: "0x0000000000000000000000000000000000000000", // Update after AUTO token deployment
  ERC20_VAULT: "0x0000000000000000000000000000000000000000", // Update after ERC20 vault deployment
  
  // Network configuration
  NETWORK: {
    chainId: 31337,
    name: "Hardhat Local",
    rpcUrl: "http://127.0.0.1:8545"
  }
};

// ABI configurations
export const ABIS = {
  ETH_VAULT: [
    "function deposit() external payable",
    "function withdraw(uint256 amount) external", 
    "function getBalance(address user) external view returns (uint256)",
    "function getTotalBalance() external view returns (uint256)",
    "function emergencyWithdraw() external",
    "event Deposit(address indexed user, uint256 amount, uint256 timestamp)",
    "event Withdraw(address indexed user, uint256 amount, uint256 timestamp)"
  ],
  
  ERC20: [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function transfer(address to, uint amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
  ],
  
  ERC20_VAULT: [
    "function deposit(uint256 amount) external",
    "function withdraw(uint256 shares) external",
    "function getBalance(address user) external view returns (uint256)",
    "function getTotalAssets() external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares)",
    "event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)"
  ]
};

// Helper function to get contract configuration
export function getContractConfig(contractName: keyof typeof CONTRACTS) {
  return {
    address: CONTRACTS[contractName],
    abi: ABIS[contractName as keyof typeof ABIS]
  };
}

// Helper function to check if contracts are deployed
export function areContractsDeployed(): ContractStatus {
  return {
    ethVault: CONTRACTS.ETH_VAULT !== "0x0000000000000000000000000000000000000000",
    usdc: CONTRACTS.USDC !== "0x0000000000000000000000000000000000000000",
    auto: CONTRACTS.AUTO !== "0x0000000000000000000000000000000000000000",
    erc20Vault: CONTRACTS.ERC20_VAULT !== "0x0000000000000000000000000000000000000000"
  };
}
