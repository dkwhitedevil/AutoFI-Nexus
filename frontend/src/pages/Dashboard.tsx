import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  Zap, 
  Activity, 
  Settings, 
  Moon, 
  Sun,
  ChevronRight,
  Play,
  Pause,
  Check,
  ArrowUpRight,
  Layers,
  BarChart3,
  Shield,
  LogOut
} from 'lucide-react';
import WalletConnectButton from '../components/WalletConnectButton';
import { usePrivyContext } from '../contexts/PrivyContext';

// Animated Counter Component
const AnimatedCounter = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}{count.toFixed(2)}{suffix}
    </span>
  );
};

// Glass Card Component
const GlassCard = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, type: 'spring', stiffness: 100 }}
    className={`rounded-2xl backdrop-blur-xl bg-purple-900/20 border border-purple-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 ${className}`}
    style={{
      backgroundColor: 'rgba(88,28,135,0.2)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(147,51,234,0.3)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      borderRadius: '16px'
    }}
  >
    {children}
  </motion.div>
);

// Gradient Button Component
const GradientButton = ({ children, onClick, className = '', variant = 'primary' }: { children: React.ReactNode; onClick?: () => void; className?: string; variant?: 'primary' | 'outline' }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500',
    outline: 'border-2 border-purple-500/30 bg-purple-900/20'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`${variants[variant as keyof typeof variants]} px-6 py-2.5 rounded-xl font-medium text-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] ${className}`}
    >
      {children}
    </motion.button>
  );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: 'running' | 'idle' | 'executed' }) => {
  const configs = {
    running: { color: 'from-green-400 to-emerald-400', icon: Play, text: 'Running' },
    idle: { color: 'from-gray-400 to-gray-500', icon: Pause, text: 'Idle' },
    executed: { color: 'from-blue-400 to-cyan-400', icon: Check, text: 'Executed' }
  };

  const config = configs[status as keyof typeof configs];
  const Icon = config.icon;

    return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${config.color} text-white text-sm font-medium`}
    >
      <Icon size={14} />
      {config.text}
    </motion.div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const { isConnected, disconnectWallet } = usePrivyContext();
  
  // Mock data
  const portfolioData = {
    totalValue: 245678.50,
    apy: 12.4,
    chains: ['Polygon', 'Arbitrum', 'Optimism', 'Base'],
    change24h: 5.67
  };

  const strategies = [
    { id: 1, name: 'Auto Rebalance ETH/USDC', status: 'running' as const, apy: 15.2, tvl: 50000 },
    { id: 2, name: 'Yield Optimizer - Aave', status: 'running' as const, apy: 8.5, tvl: 75000 },
    { id: 3, name: 'Cross-chain Arbitrage', status: 'idle' as const, apy: 22.1, tvl: 120000 }
  ];

  const activities = [
    { id: 1, type: 'Rebalance', chain: 'Polygon', amount: '+$1,245', time: '2m ago' },
    { id: 2, type: 'Yield Claim', chain: 'Arbitrum', amount: '+$892', time: '15m ago' },
    { id: 3, type: 'Cross-chain Swap', chain: 'Optimism', amount: '$5,000', time: '1h ago' },
    { id: 4, type: 'Intent Executed', chain: 'Base', amount: '+$3,421', time: '2h ago' }
  ];

  const chainActivity = [
    { chain: 'Polygon', intents: 24, volume: '$45,230' },
    { chain: 'Arbitrum', intents: 18, volume: '$38,900' },
    { chain: 'Optimism', intents: 12, volume: '$28,450' },
    { chain: 'Base', intents: 9, volume: '$15,670' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative" style={{background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)'}}>
      {/* Glossy Purple Background Layers */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Gradient mesh overlay */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-40"></div>
        {/* Soft purple glows */}
        <div className="absolute -top-40 -left-40 w-[48rem] h-[48rem] rounded-full bg-secondary-600/20 blur-3xl"></div>
        <div className="absolute -bottom-48 -right-48 w-[48rem] h-[48rem] rounded-full bg-primary-600/20 blur-3xl"></div>
      </div>

      {/* Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-purple-500/30 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight 
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          />
        ))}
      </div>

      

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 pt-24 pb-8 relative z-10">
        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlassCard delay={0.1}>
            <div className="flex items-start justify-between">
        <div>
                <p className="text-gray-400 text-sm mb-2">Total Portfolio Value</p>
                <h2 className="text-4xl font-bold mb-2">
                  $<AnimatedCounter value={portfolioData.totalValue} />
                </h2>
                <div className="flex items-center gap-2 text-green-400">
                  <TrendingUp size={16} />
                  <span>+{portfolioData.change24h}% (24h)</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="text-green-400" size={24} />
        </div>
      </div>
          </GlassCard>

          <GlassCard delay={0.2}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Average APY</p>
                <h2 className="text-4xl font-bold mb-2">
                  <AnimatedCounter value={portfolioData.apy} suffix="%" />
          </h2>
                <p className="text-gray-400 text-sm">Across all strategies</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <BarChart3 className="text-purple-400" size={24} />
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.3}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Active Chains</p>
                <h2 className="text-4xl font-bold mb-2">{portfolioData.chains.length}</h2>
                <div className="flex gap-2 flex-wrap mt-2">
                  {portfolioData.chains.map(chain => (
                    <span key={chain} className="px-2 py-1 bg-purple-700/30 border border-purple-500/30 rounded text-xs">
                      {chain}
                  </span>
                  ))}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <Layers className="text-cyan-400" size={24} />
              </div>
            </div>
          </GlassCard>
                </div>

        {/* Active Strategies */}
        <GlassCard delay={0.4} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="text-yellow-400" size={24} />
              Active Strategies
            </h3>
            <div className="flex items-center gap-3">
              {isConnected && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={disconnectWallet}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 hover:text-red-200 rounded-xl transition-all duration-300 font-medium"
                >
                  <LogOut size={16} />
                  Disconnect Wallet
                </motion.button>
              )}
              <GradientButton variant="outline" onClick={() => {}}>View All</GradientButton>
            </div>
                  </div>
          <div className="space-y-4">
            {strategies.map((strategy, idx) => (
              <motion.div
                key={strategy.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="bg-purple-800/20 rounded-xl p-4 border border-purple-500/20 hover:bg-purple-700/30 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <Shield size={20} />
                  </div>
                    <div>
                      <h4 className="font-semibold text-lg">{strategy.name}</h4>
                      <p className="text-gray-400 text-sm">TVL: ${strategy.tvl.toLocaleString()}</p>
                  </div>
                </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">APY</p>
                      <p className="text-xl font-bold text-green-400">{strategy.apy}%</p>
                    </div>
                    <StatusBadge status={strategy.status} />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      className="w-10 h-10 rounded-lg bg-purple-700/30 flex items-center justify-center group-hover:bg-purple-600/40 transition-all"
                    >
                      <ChevronRight size={20} />
                    </motion.button>
                  </div>
              </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chain Activity */}
          <GlassCard delay={0.6}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="text-cyan-400" size={20} />
              Chain Activity (Avail Nexus)
            </h3>
            <div className="space-y-3">
              {chainActivity.map((item, idx) => (
                <motion.div
                  key={item.chain}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                  className="flex items-center justify-between p-3 bg-purple-800/20 rounded-lg hover:bg-purple-700/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center">
                      <Layers size={18} />
                    </div>
                    <div>
                      <p className="font-medium">{item.chain}</p>
                      <p className="text-sm text-gray-400">{item.intents} intents</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold">{item.volume}</p>
                </motion.div>
              ))}
        </div>
          </GlassCard>

          {/* Recent Activity Feed */}
          <GlassCard delay={0.7}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="text-green-400" size={20} />
              Recent Activity (Live Data)
            </h3>
            <div className="space-y-3">
              <AnimatePresence>
                {activities.map((activity, idx) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.8 + idx * 0.1 }}
                    className="flex items-center justify-between p-3 bg-purple-800/20 rounded-lg hover:bg-purple-700/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <div>
                        <p className="font-medium">{activity.type}</p>
                        <p className="text-sm text-gray-400">{activity.chain}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">{activity.amount}</p>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                    <ArrowUpRight className="opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;