const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting AutoFi-Nexus deployment on local network...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy mock tokens for local testing
  console.log("📄 Deploying mock tokens...");
  
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  
  // Deploy USDC (6 decimals)
  const usdc = await MockERC20.deploy(
    "USD Coin",
    "USDC", 
    6,
    ethers.parseUnits("1000000", 6) // 1M USDC
  );
  await usdc.waitForDeployment();
  console.log("✅ USDC deployed to:", await usdc.getAddress());

  // Deploy AUTO token (18 decimals)
  const auto = await MockERC20.deploy(
    "AutoFi Token",
    "AUTO",
    18,
    ethers.parseEther("1000000") // 1M AUTO
  );
  await auto.waitForDeployment();
  console.log("✅ AUTO token deployed to:", await auto.getAddress());

  // Deploy StrategyManager first (needs vault and rebalance executor addresses)
  console.log("\n📊 Deploying StrategyManager...");
  const StrategyManager = await ethers.getContractFactory("StrategyManager");
  const strategyManager = await StrategyManager.deploy(
    ethers.ZeroAddress, // Will be set later
    ethers.ZeroAddress  // Will be set later
  );
  await strategyManager.waitForDeployment();
  console.log("✅ StrategyManager deployed to:", await strategyManager.getAddress());

  // Deploy RebalanceExecutor
  console.log("\n⚖️ Deploying RebalanceExecutor...");
  const RebalanceExecutor = await ethers.getContractFactory("RebalanceExecutor");
  const rebalanceExecutor = await RebalanceExecutor.deploy(
    ethers.ZeroAddress, // Will be set later
    await strategyManager.getAddress(),
    1000, // 10% rebalance threshold
    ethers.parseUnits("10000", 6), // 10,000 USDC max rebalance amount
    3600 // 1 hour cooldown period
  );
  await rebalanceExecutor.waitForDeployment();
  console.log("✅ RebalanceExecutor deployed to:", await rebalanceExecutor.getAddress());

  // Deploy AutoFiVault
  console.log("\n🏦 Deploying AutoFiVault...");
  const AutoFiVault = await ethers.getContractFactory("AutoFiVault");
  const vault = await AutoFiVault.deploy(
    await usdc.getAddress(),
    await auto.getAddress(),
    await strategyManager.getAddress(),
    await rebalanceExecutor.getAddress()
  );
  await vault.waitForDeployment();
  console.log("✅ AutoFiVault deployed to:", await vault.getAddress());

  // Update addresses in StrategyManager and RebalanceExecutor
  console.log("\n🔗 Linking contracts...");
  
  await strategyManager.setVault(await vault.getAddress());
  await strategyManager.setRebalanceExecutor(await rebalanceExecutor.getAddress());
  console.log("✅ StrategyManager linked to Vault and RebalanceExecutor");

  await rebalanceExecutor.setVault(await vault.getAddress());
  await rebalanceExecutor.setStrategyManager(await strategyManager.getAddress());
  console.log("✅ RebalanceExecutor linked to Vault and StrategyManager");

  // Deploy mock Aave protocol for testing
  console.log("\n🏛️ Deploying mock Aave protocol...");
  const MockAave = await ethers.getContractFactory("MockAave");
  const mockAave = await MockAave.deploy(
    await usdc.getAddress(),
    "Aave USDC",
    "aUSDC"
  );
  await mockAave.waitForDeployment();
  console.log("✅ Mock Aave deployed to:", await mockAave.getAddress());

  // Register a sample strategy in StrategyManager
  console.log("\n📈 Registering sample strategy...");
  await strategyManager.registerStrategy(
    await mockAave.getAddress(),
    "Aave USDC Lending",
    5000 // 50% max allocation
  );
  await strategyManager.activateStrategy(await mockAave.getAddress());
  await strategyManager.updateAllocation(await mockAave.getAddress(), 3000); // 30% allocation
  console.log("✅ Sample Aave strategy registered and activated");

  // Transfer some tokens to the vault owner for testing
  console.log("\n💰 Setting up test tokens...");
  await usdc.transfer(deployer.address, ethers.parseUnits("10000", 6));
  await auto.transfer(deployer.address, ethers.parseEther("10000"));
  console.log("✅ Test tokens transferred to deployer");

  // Display deployment summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 AutoFi-Nexus deployment completed successfully!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("┌─────────────────────┬──────────────────────────────────────────┐");
  console.log("│ Contract            │ Address                                   │");
  console.log("├─────────────────────┼──────────────────────────────────────────┤");
  console.log(`│ USDC Token          │ ${await usdc.getAddress()}`);
  console.log(`│ AUTO Token          │ ${await auto.getAddress()}`);
  console.log(`│ AutoFiVault         │ ${await vault.getAddress()}`);
  console.log(`│ StrategyManager     │ ${await strategyManager.getAddress()}`);
  console.log(`│ RebalanceExecutor   │ ${await rebalanceExecutor.getAddress()}`);
  console.log(`│ Mock Aave           │ ${await mockAave.getAddress()}`);
  console.log("└─────────────────────┴──────────────────────────────────────────┘");

  console.log("\n📊 Initial Configuration:");
  console.log(`• Vault Asset: USDC (${await usdc.getAddress()})`);
  console.log(`• Reward Token: AUTO (${await auto.getAddress()})`);
  console.log(`• Min Deposit: 100 USDC`);
  console.log(`• Lock Period: 7 days`);
  console.log(`• Rebalance Threshold: 10%`);
  console.log(`• Cooldown Period: 1 hour`);
  console.log(`• Sample Strategy: Aave USDC Lending (30% allocation)`);

  console.log("\n🧪 Testing Commands:");
  console.log("• Run tests: npm test");
  console.log("• Start local node: npm run node");
  console.log("• Deploy to local: npm run deploy:local");

  console.log("\n🔗 Next Steps:");
  console.log("1. Fund the vault with USDC for testing");
  console.log("2. Register additional strategies");
  console.log("3. Configure rebalancing parameters");
  console.log("4. Test the complete flow");

  // Save deployment info to a file for reference
  const deploymentInfo = {
    network: "localhost",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      USDC: await usdc.getAddress(),
      AUTO: await auto.getAddress(),
      AutoFiVault: await vault.getAddress(),
      StrategyManager: await strategyManager.getAddress(),
      RebalanceExecutor: await rebalanceExecutor.getAddress(),
      MockAave: await mockAave.getAddress()
    }
  };

  console.log("\n💾 Deployment info saved to deployment-local.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });