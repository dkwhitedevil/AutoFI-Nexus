# 🏦 AutoFi Nexus Vault Setup Guide

Complete guide to set up and test the local Hardhat vault environment.

## 🚀 Quick Start

### 1️⃣ Start Hardhat Local Node

```bash
cd hardhat-vault
npx hardhat node
```

This will:
- Start a local Ethereum node on `http://127.0.0.1:8545`
- Create 20 test accounts with 10,000 ETH each
- Display private keys for testing

### 2️⃣ Deploy Vault Contract

Open a **new terminal** and run:

```bash
cd hardhat-vault
npx hardhat run scripts/deploy.js --network localhost
```

This will:
- Deploy the Vault smart contract
- Save contract address to `frontend/src/contracts/vault-deployment.json`
- Display the deployed contract address

### 3️⃣ Start Frontend

```bash
cd frontend
npm run dev
```

Navigate to the **Vault** page to interact with your deployed contract.

## 📋 Features

### ✅ Smart Contract Features
- **Deposit ETH** - Store ETH in the vault
- **Withdraw ETH** - Retrieve your deposited ETH
- **Balance Tracking** - Real-time balance updates
- **Event Emissions** - Transaction history tracking
- **Emergency Withdraw** - Withdraw all funds at once

### ✅ Frontend Features
- **Real-time Balance Display** - Wallet, Vault, and Total TVL
- **Deposit Interface** - Custom amount deposits
- **Withdraw Interface** - Custom amount withdrawals
- **Transaction History** - Live transaction tracking
- **Auto-refresh** - Balances update automatically
- **Manual Refresh** - Click to update balances
- **Loading States** - Visual feedback during transactions
- **Error Handling** - User-friendly error messages

## 🔧 MetaMask Setup

### Add Hardhat Network to MetaMask

1. **Network Name**: Hardhat Local
2. **RPC URL**: `http://127.0.0.1:8545`
3. **Chain ID**: `31337`
4. **Currency Symbol**: `ETH`

### Import Test Account

Use one of the private keys from the Hardhat node output:
- Account #0: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- Account #1: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

## 🎯 Testing Workflow

1. **Connect Wallet** - Use Privy to connect your MetaMask
2. **Check Balances** - See your wallet ETH balance
3. **Deposit ETH** - Try depositing 1 ETH to the vault
4. **Watch Updates** - See balances update in real-time
5. **View History** - Check transaction history
6. **Withdraw ETH** - Withdraw some or all funds
7. **Emergency Withdraw** - Test the emergency withdraw feature

## 📊 Contract Details

### Vault.sol Functions
```solidity
function deposit() external payable
function withdraw(uint256 amount) external  
function getBalance(address user) external view returns (uint256)
function getTotalBalance() external view returns (uint256)
function emergencyWithdraw() external
```

### Events
```solidity
event Deposit(address indexed user, uint256 amount, uint256 timestamp)
event Withdraw(address indexed user, uint256 amount, uint256 timestamp)
```

## 🛠️ Troubleshooting

### Contract Not Deployed
If you see "Vault Contract Not Deployed":
1. Make sure Hardhat node is running
2. Deploy the contract: `npx hardhat run scripts/deploy.js --network localhost`
3. Refresh the frontend

### MetaMask Issues
- Switch to Hardhat Local network
- Make sure you're using a test account
- Reset account in MetaMask if needed

### Balance Not Updating
- Click the refresh button
- Check if MetaMask is connected
- Verify you're on the correct network

## 🔄 Reset Environment

To start fresh:
1. Stop Hardhat node (Ctrl+C)
2. Restart: `npx hardhat node`
3. Redeploy: `npx hardhat run scripts/deploy.js --network localhost`
4. Refresh frontend

## 📈 Next Steps

- Add more vault strategies
- Implement yield farming
- Add multi-token support
- Deploy to testnets
- Add governance features

---

**Your local DeFi vault is ready for testing!** 🎉
