// Contract-related types
export interface VaultInfo {
  address: string;
  totalAssets: string;
  totalShares: string;
  assetToken: string;
  rewardToken: string;
  minDeposit: string;
  lockPeriod: number;
}

export interface Strategy {
  address: string;
  name: string;
  allocation: number;
  maxAllocation: number;
  isActive: boolean;
  totalDeposited: string;
  totalWithdrawn: string;
  performanceScore: number;
  apy: number;
}

export interface UserVaultData {
  balance: string;
  shares: string;
  sharePercentage: number;
  isLocked: boolean;
  lastDepositTime: number;
}

export interface RebalanceEvent {
  id: number;
  timestamp: number;
  totalAmount: string;
  strategies: string[];
  amounts: string[];
  reason: string;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PortfolioMetrics {
  totalValueLocked: string;
  totalYield: string;
  apy: number;
  riskScore: number;
  strategies: Strategy[];
}

// Transaction types
export interface Transaction {
  hash: string;
  type: 'deposit' | 'withdraw' | 'rebalance' | 'strategy_execution';
  amount?: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
}

// Form types
export interface DepositForm {
  amount: string;
  token: string;
}

export interface WithdrawForm {
  shares: string;
}

export interface StrategyForm {
  name: string;
  address: string;
  maxAllocation: number;
}

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
  }[];
}

// Wallet types
export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
  isConnected: boolean;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Theme types
export type Theme = 'light' | 'dark';

// Navigation types
export interface NavItem {
  name: string;
  href: string;
  icon: string;
  current?: boolean;
}