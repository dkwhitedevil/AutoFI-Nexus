import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import { PrivyWalletProvider } from './contexts/PrivyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Analytics from './pages/Analytics';
import AutoFiNexusPage from './pages/AutoFiNexusPage';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Strategies from './pages/Strategies';
import Vault from './pages/Vault';
import VaultTest from './pages/VaultTest';


function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-900 text-gray-100 font-sans">
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
    </div>
  );
}

export default App;