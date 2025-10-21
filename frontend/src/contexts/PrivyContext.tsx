import React, { createContext, useContext, ReactNode } from 'react';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';

interface PrivyContextType {
  isConnected: boolean;
  isConnecting: boolean;
  user: any;
  wallet: any;
  connectWallet: () => void;
  disconnectWallet: () => void;
  error: any;
}

const PrivyContext = createContext<PrivyContextType | undefined>(undefined);

// Inner component that uses Privy hooks
function PrivyContextProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [error, setError] = React.useState<string | null>(null);
  
  const wallet = wallets[0]; // Get the first connected wallet
  const isConnected = ready && authenticated && !!wallet;
  const isConnecting = !ready;

  const connectWallet = async () => {
    try {
      setError(null);
      await login();
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      if (err.message?.includes('User rejected') || err.message?.includes('rejected the request')) {
        setError('Connection was cancelled. Please try again when ready to connect your wallet.');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
    }
  };

  const disconnectWallet = async () => {
    try {
      setError(null);
      await logout();
    } catch (err: any) {
      console.error('Wallet disconnection error:', err);
      setError('Failed to disconnect wallet.');
    }
  };

  const contextValue: PrivyContextType = {
    isConnected,
    isConnecting,
    user,
    wallet,
    connectWallet,
    disconnectWallet,
    error,
  };

  return (
    <PrivyContext.Provider value={contextValue}>
      {children}
    </PrivyContext.Provider>
  );
}

// Main provider component
export function PrivyWalletProvider({ children }: { children: ReactNode }) {
  const appId = 'cmgvzg9y6005yji0dw1u3dhc5'; // Hardcoded for now to avoid env issues
  
  return (
    <PrivyProvider
      appId={appId}
      config={{
        // Customize the appearance
        appearance: {
          theme: 'dark',
          accentColor: '#8b5cf6',
        },
        // Configure supported wallet types (only email to avoid passwordless conflict)
        loginMethods: ['wallet', 'email'],
        // Configure wallet connection options to reduce errors
        walletConnectCloudProjectId: undefined, // Disable WalletConnect to reduce external requests
        // Reduce external API calls in development
        embeddedWallets: {
          createOnLogin: 'off', // Disable embedded wallet creation to reduce API calls
        },
      }}
    >
      <PrivyContextProvider>
        {children}
      </PrivyContextProvider>
    </PrivyProvider>
  );
}

// Hook to use the Privy context
export function usePrivyContext() {
  const context = useContext(PrivyContext);
  if (context === undefined) {
    throw new Error('usePrivyContext must be used within a PrivyWalletProvider');
  }
  return context;
}

// Export for backward compatibility with existing Web3Context usage
export const useWeb3Context = usePrivyContext;
