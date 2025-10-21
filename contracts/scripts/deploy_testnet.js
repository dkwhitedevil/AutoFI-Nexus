const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting AutoFi-Nexus deployment to testnet...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Check network
  const network = await ethers.provider.getNetwork();
  console.log(`🌐 Deploying to network: ${network.name} (Chain ID: ${network.chainId})\n`);

  // For testnet deployment, we'll use real token addresses or deploy our own
  let assetToken, rewardToken;

  if (network.name === "sepolia") {
    // Use USDC on Sepolia (if available) or deploy mock
    console.log("📄 Setting up tokens for Sepolia...");
    
    // Deploy mock USDC for Sepolia (real USDC might not be available)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    assetToken = await MockERC20.deploy(
      "USD Coin",
      "USDC",
      6,
      ethers.parseUnits("1000000", 6) // 1M USDC
    );
    await assetToken.waitForDeployment();
    console.log("✅ Mock USDC deployed to:", await assetToken.getAddress());

    rewardToken = await MockERC20.deploy(
      "AutoFi Token",
      "AUTO",
      18,
      ethers.parseEther("1000000") // 1M AUTO
    );
    await rewardToken.waitForDeployment();
    console.log("✅ AUTO token deployed to:", await rewardToken.getAddress());

  } else if (network.name === "matic") {
    // Use real USDC on Polygon
    console.log("📄 Using real tokens on Polygon...");
    
    // Real USDC on Polygon: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
    assetToken = await ethers.getContractAt(
      "IERC20",
      "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
    );
    console.log("✅ Using real USDC on Polygon:", await assetToken.getAddress());

    // Deploy AUTO token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    rewardToken = await MockERC20.deploy(
      "AutoFi Token",
      "AUTO",
      18,
      ethers.parseEther("1000000") // 1M AUTO
    );
    await rewardToken.waitForDeployment();
    console.log("✅ AUTO token deployed to:", await rewardToken.getAddress());

  } else {
    // For other networks, deploy mock tokens
    console.log("📄 Deploying mock tokens...");
    
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    assetToken = await MockERC20.deploy(
      "USD Coin",
      "USDC",
      6,
      ethers.parseUnits("1000000", 6) // 1M USDC
    );
    await assetToken.waitForDeployment();
    console.log("✅ Mock USDC deployed to:", await assetToken.getAddress());

    rewardToken = await MockERC20.deploy(
      "AutoFi Token",
      "AUTO",
      18,
      ethers.parseEther("1000000") // 1M AUTO
    );
    await rewardToken.waitForDeployment();
    console.log("✅ AUTO token deployed to:", await rewardToken.getAddress());
  }

  // Deploy StrategyManager first
  console.log("\n📊 Deploying StrategyManager...");
  const StrategyManager = await ethers.getContractFactory("StrategyManager");
  const strategyManager = await StrategyManager.deploy(
    ethers.ZeroAddress, // Will be set later
    ethers.ZeroAddress  // Will be set later
  );
  await strategyManager.waitForDeployment();
  console.log("✅ StrategyManager deployed to:", await strategyManager.getAddress());

  // Deploy RebalanceExecutor with testnet-appropriate parameters
  console.log("\n⚖️ Deploying RebalanceExecutor...");
  const RebalanceExecutor = await ethers.getContractFactory("RebalanceExecutor");
  const rebalanceExecutor = await RebalanceExecutor.deploy(
    ethers.ZeroAddress, // Will be set later
    await strategyManager.getAddress(),
    500, // 5% rebalance threshold (more conservative for testnet)
    ethers.parseUnits("50000", 6), // 50,000 USDC max rebalance amount
    1800 // 30 minutes cooldown (shorter for testing)
  );
  await rebalanceExecutor.waitForDeployment();
  console.log("✅ RebalanceExecutor deployed to:", await rebalanceExecutor.getAddress());

  // Deploy AutoFiVault
  console.log("\n🏦 Deploying AutoFiVault...");
  const AutoFiVault = await ethers.getContractFactory("AutoFiVault");
  const vault = await AutoFiVault.deploy(
    await assetToken.getAddress(),
    await rewardToken.getAddress(),
    await strategyManager.getAddress(),
    await rebalanceExecutor.getAddress()
  );
  await vault.waitForDeployment();
  console.log("✅ AutoFiVault deployed to:", await vault.getAddress());

  // Link contracts
  console.log("\n🔗 Linking contracts...");
  await strategyManager.setVault(await vault.getAddress());
  await strategyManager.setRebalanceExecutor(await rebalanceExecutor.getAddress());
  console.log("✅ StrategyManager linked");

  await rebalanceExecutor.setVault(await vault.getAddress());
  await rebalanceExecutor.setStrategyManager(await strategyManager.getAddress());
  console.log("✅ RebalanceExecutor linked");

  // Deploy mock protocols for testing (only for non-mainnet networks)
  if (network.name !== "mainnet") {
    console.log("\n🏛️ Deploying mock protocols...");
    
    const MockAave = await ethers.getContractFactory("MockAave");
    const mockAave = await MockAave.deploy(
      await assetToken.getAddress(),
      "Aave USDC",
      "aUSDC"
    );
    await mockAave.waitForDeployment();
    console.log("✅ Mock Aave deployed to:", await mockAave.getAddress());

    // Register sample strategies
    console.log("\n📈 Registering sample strategies...");
    
    await strategyManager.registerStrategy(
      await mockAave.getAddress(),
      "Aave USDC Lending",
      4000 // 40% max allocation
    );
    await strategyManager.activateStrategy(await mockAave.getAddress());
    await strategyManager.updateAllocation(await mockAave.getAddress(), 2000); // 20% allocation
    console.log("✅ Aave strategy registered and activated");
  }

  // Display deployment summary
  console.log("\n" + "=".repeat(70));
  console.log("🎉 AutoFi-Nexus testnet deployment completed successfully!");
  console.log("=".repeat(70));
  console.log("\n📋 Contract Addresses:");
  console.log("┌─────────────────────┬──────────────────────────────────────────┐");
  console.log("│ Contract            │ Address                                   │");
  console.log("├─────────────────────┼──────────────────────────────────────────┤");
  console.log(`│ Asset Token (USDC)  │ ${await assetToken.getAddress()}`);
  console.log(`│ Reward Token (AUTO) │ ${await rewardToken.getAddress()}`);
  console.log(`│ AutoFiVault         │ ${await vault.getAddress()}`);
  console.log(`│ StrategyManager     │ ${await strategyManager.getAddress()}`);
  console.log(`│ RebalanceExecutor   │ ${await rebalanceExecutor.getAddress()}`);
  
  if (network.name !== "mainnet") {
    console.log(`│ Mock Aave          │ ${await mockAave.getAddress()}`);
  }
  
  console.log("└─────────────────────┴──────────────────────────────────────────┘");

  console.log("\n📊 Testnet Configuration:");
  console.log(`• Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`• Vault Asset: ${await assetToken.getAddress()}`);
  console.log(`• Reward Token: ${await rewardToken.getAddress()}`);
  console.log(`• Min Deposit: 100 USDC`);
  console.log(`• Lock Period: 7 days`);
  console.log(`• Rebalance Threshold: 5%`);
  console.log(`• Cooldown Period: 30 minutes`);
  console.log(`• Max Rebalance Amount: 50,000 USDC`);

  console.log("\n🔗 Verification Commands:");
  console.log(`npx hardhat verify --network ${network.name} ${await vault.getAddress()} "${await assetToken.getAddress()}" "${await rewardToken.getAddress()}" "${await strategyManager.getAddress()}" "${await rebalanceExecutor.getAddress()}"`);
  console.log(`npx hardhat verify --network ${network.name} ${await strategyManager.getAddress()} "${await vault.getAddress()}" "${await rebalanceExecutor.getAddress()}"`);
  console.log(`npx hardhat verify --network ${network.name} ${await rebalanceExecutor.getAddress()} "${await vault.getAddress()}" "${await strategyManager.getAddress()}" 500 "${ethers.parseUnits("50000", 6)}" 1800`);

  console.log("\n🧪 Testing Commands:");
  console.log(`• Deploy to ${network.name}: npm run deploy:${network.name}`);
  console.log(`• Verify contracts: npm run verify:${network.name}`);

  console.log("\n⚠️  Security Notes:");
  console.log("• This is a testnet deployment - do not use real funds");
  console.log("• Verify all contracts on block explorer before mainnet deployment");
  console.log("• Test thoroughly before moving to production");
  console.log("• Consider multi-sig for production deployment");

  console.log("\n🔗 Next Steps:");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Test all functionality with small amounts");
  console.log("3. Register additional strategies");
  console.log("4. Configure monitoring and alerts");
  console.log("5. Plan mainnet deployment strategy");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      AssetToken: await assetToken.getAddress(),
      RewardToken: await rewardToken.getAddress(),
      AutoFiVault: await vault.getAddress(),
      StrategyManager: await strategyManager.getAddress(),
      RebalanceExecutor: await rebalanceExecutor.getAddress(),
    }
  };

  if (network.name !== "mainnet") {
    deploymentInfo.contracts.MockAave = await mockAave.getAddress();
  }

  console.log("\n💾 Deployment info saved to deployment-testnet.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });