import { ethers } from "ethers";
import fs from 'fs';

async function main() {
  console.log("🚀 Deploying AutoFi Nexus Vault...");
  
  // Connect to local Hardhat node
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  // Use the first account from Hardhat node
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Read the compiled contract
  const contractJson = JSON.parse(fs.readFileSync('./artifacts/contracts/Vault.sol/Vault.json', 'utf8'));
  
  // Create contract factory
  const Vault = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, wallet);
  
  // Deploy the contract
  const vault = await Vault.deploy();
  
  // Wait for deployment to complete
  await vault.waitForDeployment();
  
  const vaultAddress = await vault.getAddress();
  
  console.log("✅ Vault deployed successfully!");
  console.log("📍 Contract Address:", vaultAddress);
  console.log("🌐 Network: localhost");
  console.log("⛽ Gas Used: Deployment completed");
  
  // Save deployment info to a file for frontend use
  const deploymentInfo = {
    contractAddress: vaultAddress,
    network: "localhost",
    deployedAt: new Date().toISOString(),
    abi: [
      "function deposit() external payable",
      "function withdraw(uint256 amount) external", 
      "function getBalance(address user) external view returns (uint256)",
      "function getTotalBalance() external view returns (uint256)",
      "function emergencyWithdraw() external",
      "event Deposit(address indexed user, uint256 amount, uint256 timestamp)",
      "event Withdraw(address indexed user, uint256 amount, uint256 timestamp)"
    ]
  };
  
  fs.writeFileSync(
    '../frontend/src/contracts/vault-deployment.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("💾 Deployment info saved to frontend/src/contracts/vault-deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
