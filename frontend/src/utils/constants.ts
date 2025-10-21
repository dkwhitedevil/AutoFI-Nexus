// Contract addresses (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  // Local development
  localhost: {
    AutoFiVault: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    StrategyManager: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    RebalanceExecutor: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    USDC: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    AUTO: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  },
  // Sepolia testnet
  sepolia: {
    AutoFiVault: '',
    StrategyManager: '',
    RebalanceExecutor: '',
    USDC: '',
    AUTO: '',
  },
  // Polygon testnet
  polygon: {
    AutoFiVault: '',
    StrategyManager: '',
    RebalanceExecutor: '',
    USDC: '',
    AUTO: '',
  },
} as const;

// Network configurations
export const NETWORKS = {
  localhost: {
    chainId: 31337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: '',
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID',
    blockExplorer: 'https://polygonscan.com',
  },
} as const;

// Token configurations
export const TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '',
  },
  AUTO: {
    symbol: 'AUTO',
    name: 'AutoFi Token',
    decimals: 18,
    address: '',
  },
} as const;

// Application constants
export const APP_CONFIG = {
  name: 'AutoFi-Nexus',
  description: 'Automated DeFi Vault Management Platform',
  version: '1.0.0',
  minDeposit: '100', // 100 USDC
  lockPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  maxStrategies: 10,
  defaultGasLimit: '500000',
  refreshInterval: 30000, // 30 seconds
} as const;

// API endpoints
export const API_ENDPOINTS = {
  base: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  vault: '/api/vault',
  strategies: '/api/strategies',
  analytics: '/api/analytics',
  transactions: '/api/transactions',
} as const;

// Chart colors
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#a855f7',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  gray: '#6b7280',
} as const;

// Navigation items
export const NAV_ITEMS = [
  {
    name: 'Dashboard',
    href: '/',
    icon: 'ChartBarIcon',
  },
  {
    name: 'Vault',
    href: '/vault',
    icon: 'BanknotesIcon',
  },
  {
    name: 'Strategies',
    href: '/strategies',
    icon: 'CogIcon',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: 'ChartPieIcon',
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: 'UserIcon',
  },
] as const;

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  TRANSACTION_FAILED: 'Transaction failed. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  INVALID_ADDRESS: 'Invalid address format',
  INVALID_AMOUNT: 'Invalid amount. Please enter a valid number',
  DEPOSIT_TOO_SMALL: `Minimum deposit is ${APP_CONFIG.minDeposit} USDC`,
  FUNDS_LOCKED: 'Your funds are locked. Please wait for the lock period to end',
  STRATEGY_NOT_ACTIVE: 'This strategy is not active',
  ALLOCATION_EXCEEDED: 'Allocation exceeds maximum allowed',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  DEPOSIT_SUCCESS: 'Deposit completed successfully',
  WITHDRAWAL_SUCCESS: 'Withdrawal completed successfully',
  STRATEGY_EXECUTED: 'Strategy executed successfully',
  REBALANCE_SUCCESS: 'Rebalancing completed successfully',
  TRANSACTION_CONFIRMED: 'Transaction confirmed',
} as const;

// Loading messages
export const LOADING_MESSAGES = {
  CONNECTING_WALLET: 'Connecting wallet...',
  PROCESSING_TRANSACTION: 'Processing transaction...',
  WAITING_CONFIRMATION: 'Waiting for confirmation...',
  LOADING_DATA: 'Loading data...',
  UPDATING_BALANCE: 'Updating balance...',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  WALLET_TYPE: 'autofi_wallet_type',
  THEME: 'autofi_theme',
  LANGUAGE: 'autofi_language',
  USER_PREFERENCES: 'autofi_user_preferences',
} as const;

// Animation durations
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

// Breakpoints
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;