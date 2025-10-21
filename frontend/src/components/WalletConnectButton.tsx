import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ERROR_MESSAGES } from '../utils/constants';
import { Wallet, AlertTriangle, LogOut, Link } from 'lucide-react';

export default function WalletConnectButton() {
  const { ready, authenticated, user, login, logout, linkWallet } = usePrivy();
  const { wallets } = useWallets();
  const [showError, setShowError] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Add global error handler for this component
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Global error caught in WalletConnectButton:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Unhandled promise rejection in WalletConnectButton:', {
        reason: event.reason,
        promise: event.promise
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    // Update local state when authentication changes
    try {
      setIsLoggedIn(ready && authenticated && !!user);
      console.log('Auth state updated:', { ready, authenticated, hasUser: !!user });
    } catch (error) {
      console.error('Error in auth state update:', error);
    }
  }, [ready, authenticated, user]);

  // Analytics are now handled by Privy SDK configuration

  const handleConnect = async () => {
    console.log('🔌 Starting wallet connection process...');
    try {
      if (isLoggedIn) {
        // User is already logged in, no need to call login again
        console.log('✅ User already authenticated');
        return;
      }
      
      console.log('🚀 Initiating Privy login...');
      // User not logged in, proceed with login
      await login();
      console.log('✅ Privy login completed successfully');
      
      // Analytics are handled automatically by Privy SDK
      console.log('✅ Wallet connection completed - analytics handled by Privy SDK');
    } catch (err) {
      console.error('❌ Login failed with detailed error:', {
        error: err,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorName: err instanceof Error ? err.name : 'UnknownError',
        errorStack: err instanceof Error ? err.stack : 'No stack trace',
        timestamp: new Date().toISOString()
      });
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleLinkWallet = async () => {
    try {
      if (!user) {
        console.warn('No user logged in. Connect first.');
        return;
      }

      await linkWallet();
      console.log('Wallet linking initiated');

      // Analytics are handled automatically by Privy SDK
      console.log('✅ Wallet linking completed - analytics handled by Privy SDK');
    } catch (err) {
      console.error('Error linking wallet:', err);
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
      setIsLoggedIn(false);
      
      // Analytics are handled automatically by Privy SDK
      console.log('✅ Wallet disconnection completed - analytics handled by Privy SDK');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const isConnecting = !ready;
  const hasWallet = wallets.length > 0;

  // Add error boundary wrapper
  const ErrorBoundaryWrapper = ({ children }: { children: React.ReactNode }) => {
    const [hasError, setHasError] = useState(false);
    
    useEffect(() => {
      const errorHandler = (error: Error) => {
        console.error('🚨 React Error Boundary caught error:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        setHasError(true);
      };
      
      return () => {
        // Cleanup if needed
      };
    }, []);

    if (hasError) {
      return (
        <div className="text-red-500 p-4 border border-red-300 rounded">
          Something went wrong with the wallet button. Check console for details.
        </div>
      );
    }

    return <>{children}</>;
  };

  return (
    <ErrorBoundaryWrapper>
      <div className="relative flex items-center gap-3">
      <motion.button
        onClick={isLoggedIn ? undefined : handleConnect}
        disabled={isConnecting}
        className="btn-primary flex items-center gap-x-3 px-6 py-3"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        aria-busy={isConnecting}
      >
        {isConnecting ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            <span className="font-semibold">Connecting...</span>
          </>
        ) : isLoggedIn ? (
          <>
            <Wallet className="h-5 w-5" />
            <span className="font-semibold">
              {hasWallet ? 'Wallet Connected' : 'Logged In'}
            </span>
          </>
        ) : (
          <>
            <Wallet className="h-5 w-5" />
            <span className="font-semibold">Connect Wallet</span>
          </>
        )}
      </motion.button>

      {/* Link Wallet and Disconnect buttons when logged in */}
      {isLoggedIn && (
        <>
          <motion.button
            onClick={handleLinkWallet}
            className="btn-secondary flex items-center gap-x-2 px-4 py-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Link className="h-4 w-4" />
            <span className="font-medium">Link Wallet</span>
          </motion.button>
          
          <motion.button
            onClick={handleDisconnect}
            className="btn-outline flex items-center gap-x-2 px-4 py-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <LogOut className="h-4 w-4" />
            <span className="font-medium">Disconnect</span>
          </motion.button>
        </>
      )}

      {/* Error message */}
      <AnimatePresence>
        {showError && (
          <motion.div 
            className="absolute top-full mt-3 right-0 glass-effect border border-red-500/30 rounded-2xl p-4 shadow-glow z-50 min-w-80"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-red-500/20 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-1">
                  Connection Failed
                </h3>
                <p className="text-sm text-gray-300">
                  {ERROR_MESSAGES.WALLET_NOT_CONNECTED}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundaryWrapper>
  );
}