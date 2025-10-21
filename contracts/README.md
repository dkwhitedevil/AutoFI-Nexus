# AutoFi-Nexus Smart Contracts

🚀 **Automated DeFi Vault Management System**

AutoFi-Nexus is a sophisticated smart contract system that automates yield farming strategies across multiple DeFi protocols. The system intelligently manages user deposits, executes yield farming strategies, and automatically rebalances allocations based on performance metrics.

## 📁 Project Structure

```
contracts/
├── contracts/                  # Solidity smart contracts
│   ├── AutoFiVault.sol        # Main vault contract
│   ├── StrategyManager.sol    # Strategy management system
│   └── RebalanceExecutor.sol  # Automated rebalancing logic
├── test/                       # Comprehensive test suite
│   ├── AutoFiVault.test.js
│   ├── StrategyManager.test.js
│   ├── RebalanceExecutor.test.js
│   ├── MockERC20.sol          # Mock token for testing
│   └── MockAave.sol           # Mock protocol for testing
├── scripts/                    # Deployment and setup scripts
│   ├── deploy_local.js        # Local development deployment
│   └── deploy_testnet.js      # Testnet deployment
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## 🏗️ Architecture Overview

### Core Contracts

#### 1. **AutoFiVault** 
The main vault contract that manages user deposits and withdrawals.

**Key Features:**
- ✅ Secure deposit/withdrawal system with 7-day lock period
- ✅ Minimum deposit requirement (100 USDC)
- ✅ Automated strategy execution
- ✅ Emergency pause functionality
- ✅ Owner controls and emergency withdrawals

**Functions:**
- `deposit(uint256 amount)` - Deposit assets into the vault
- `withdraw(uint256 shares)` - Withdraw assets (after lock period)
- `executeStrategy(address strategy, uint256 amount)` - Execute yield farming
- `rebalance(address[] strategies, uint256[] amounts)` - Rebalance allocations

#### 2. **StrategyManager**
Manages multiple yield farming strategies and their allocations.

**Key Features:**
- ✅ Strategy registration and activation
- ✅ Dynamic allocation management
- ✅ Performance tracking and scoring
- ✅ Risk management controls

**Functions:**
- `registerStrategy(address strategy, string name, uint256 maxAllocation)` - Register new strategy
- `activateStrategy(address strategy)` - Activate a strategy
- `updateAllocation(address strategy, uint256 newAllocation)` - Update strategy allocation
- `updatePerformance(address strategy, uint256 newAPY, uint256 performanceScore)` - Track performance

#### 3. **RebalanceExecutor**
Executes automated rebalancing based on strategy performance.

**Key Features:**
- ✅ Automated rebalancing triggers
- ✅ Performance-based allocation adjustments
- ✅ Cooldown periods and safety mechanisms
- ✅ Emergency rebalancing capabilities

**Functions:**
- `executeRebalance(address[] strategies, uint256[] amounts, string reason)` - Execute rebalancing
- `triggerAutoRebalance()` - Trigger automatic rebalancing
- `analyzePerformance(address[] strategies)` - Analyze strategy performance
- `calculateOptimalAllocation(address[] strategies, uint256[] currentAllocations)` - Calculate optimal allocations

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AutoFi-Nexus/contracts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Compile contracts**
   ```bash
   npm run compile
   ```

### Local Development

1. **Start local Hardhat node**
   ```bash
   npm run node
   ```

2. **Deploy to local network**
   ```bash
   npm run deploy:local
   ```

3. **Run tests**
   ```bash
   npm test
   ```

### Testnet Deployment

1. **Deploy to Sepolia testnet**
   ```bash
   npm run deploy:sepolia
   ```

2. **Deploy to Polygon testnet**
   ```bash
   npm run deploy:polygon
   ```

3. **Verify contracts**
   ```bash
   npm run verify:sepolia
   npm run verify:polygon
   ```

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/AutoFiVault.test.js

# Run tests with gas reporting
npm run gas-report

# Run coverage analysis
npm run coverage
```

### Test Coverage
- ✅ AutoFiVault functionality (deposits, withdrawals, strategy execution)
- ✅ StrategyManager operations (registration, allocation, performance)
- ✅ RebalanceExecutor logic (rebalancing, performance analysis)
- ✅ Security features (access controls, emergency functions)
- ✅ Edge cases and error conditions

## 📊 Gas Optimization

The contracts are optimized for gas efficiency:

- **AutoFiVault**: ~2.5M gas for deployment
- **StrategyManager**: ~1.8M gas for deployment  
- **RebalanceExecutor**: ~2.2M gas for deployment

### Gas Usage Estimates
- Deposit: ~180k gas
- Withdrawal: ~120k gas
- Strategy execution: ~100k gas
- Rebalancing: ~200k gas per strategy

## 🔒 Security Features

### Access Controls
- **Ownable**: Owner-only administrative functions
- **Role-based**: Specific roles for vault, strategy manager, and rebalance executor
- **Pausable**: Emergency pause functionality

### Safety Mechanisms
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Lock periods**: 7-day lock on deposits
- **Minimum deposits**: 100 USDC minimum
- **Allocation limits**: Maximum allocation per strategy
- **Cooldown periods**: Minimum time between rebalances

### Emergency Functions
- **Emergency pause**: Halt all operations
- **Emergency withdrawal**: Owner can withdraw funds
- **Emergency reset**: Reset allocations in crisis

## 🌐 Network Support

### Supported Networks
- **Local Development**: Hardhat local network
- **Testnets**: Sepolia, Polygon Mumbai
- **Mainnet**: Ethereum, Polygon (planned)

### Network Configuration
Each network has optimized parameters:
- **Local**: Aggressive settings for testing
- **Testnet**: Conservative settings for safety
- **Mainnet**: Production-ready parameters

## 📈 Monitoring & Analytics

### Key Metrics
- **Total Value Locked (TVL)**: Total assets in vault
- **Strategy Performance**: APY and performance scores
- **Rebalancing Frequency**: Number of rebalances executed
- **User Activity**: Deposits, withdrawals, and user counts

### Events for Tracking
All major operations emit events for off-chain monitoring:
- `Deposit`, `Withdraw` - User activity
- `StrategyExecuted` - Strategy operations
- `RebalanceExecuted` - Rebalancing events
- `PerformanceUpdated` - Performance metrics

## 🔧 Configuration

### Environment Variables
```bash
# RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID

# Private Key (keep secure!)
PRIVATE_KEY=your_private_key_here

# API Keys for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### Contract Parameters
- **Min Deposit**: 100 USDC
- **Lock Period**: 7 days
- **Rebalance Threshold**: 5-10%
- **Cooldown Period**: 30 minutes - 1 hour
- **Max Strategies**: 10

## 🚨 Known Limitations

1. **Strategy Integration**: Currently supports mock protocols; real DeFi integration requires additional development
2. **Oracle Dependencies**: Performance analysis relies on external data sources
3. **Governance**: No decentralized governance mechanism implemented
4. **Upgradeability**: Contracts are not upgradeable (immutable for security)

## 🔮 Future Enhancements

### Phase 2: Frontend Integration
- React-based user interface
- Real-time dashboard
- Mobile-responsive design

### Phase 3: Advanced Features
- Multi-signature governance
- Advanced strategy protocols
- Cross-chain functionality
- Automated yield optimization

### Phase 4: Ecosystem
- Strategy marketplace
- Community governance
- Token economics
- Partnership integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Development Guidelines
- Follow Solidity style guide
- Write comprehensive tests
- Document all functions
- Optimize for gas efficiency

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions and support:
- 📧 Email: support@autofi-nexus.com
- 💬 Discord: [AutoFi-Nexus Community]
- 📖 Documentation: [Full Documentation]

---

**⚠️ Disclaimer**: This software is provided for educational and testing purposes. Use at your own risk. Always conduct thorough testing before using with real funds.