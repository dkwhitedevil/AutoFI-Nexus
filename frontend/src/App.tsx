import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { PrivyWalletProvider } from './contexts/PrivyContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Vault from './pages/Vault';
import VaultTest from './pages/VaultTest';
import Strategies from './pages/Strategies';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import AutoFiNexusPage from './pages/AutoFiNexusPage';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <PrivyWalletProvider>
        <ThemeProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route path="/standalone" element={<AutoFiNexusPage />} />
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/vault" element={<Vault />} />
                    <Route path="/vault-test" element={<VaultTest />} />
                    <Route path="/strategies" element={<Strategies />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/profile" element={<Profile />} />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </Router>
        </ThemeProvider>
      </PrivyWalletProvider>
    </ErrorBoundary>
  );
}

export default App;