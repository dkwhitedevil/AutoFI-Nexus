const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AutoFiVault", function () {
  let vault;
  let asset;
  let rewardToken;
  let strategyManager;
  let rebalanceExecutor;
  let owner;
  let user1;
  let user2;

  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens
  const MIN_DEPOSIT = ethers.parseUnits("100", 6); // 100 USDC (6 decimals)

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    asset = await MockERC20.deploy("USD Coin", "USDC", 6, INITIAL_SUPPLY);
    rewardToken = await MockERC20.deploy("AutoFi Token", "AUTO", 18, INITIAL_SUPPLY);

    // Deploy strategy manager and rebalance executor
    const StrategyManager = await ethers.getContractFactory("StrategyManager");
    const RebalanceExecutor = await ethers.getContractFactory("RebalanceExecutor");

    strategyManager = await StrategyManager.deploy(ethers.ZeroAddress, ethers.ZeroAddress);
    rebalanceExecutor = await RebalanceExecutor.deploy(
      ethers.ZeroAddress,
      ethers.ZeroAddress,
      1000, // 10% rebalance threshold
      ethers.parseEther("1000"), // max rebalance amount
      3600 // 1 hour cooldown
    );

    // Deploy vault
    const AutoFiVault = await ethers.getContractFactory("AutoFiVault");
    vault = await AutoFiVault.deploy(
      await asset.getAddress(),
      await rewardToken.getAddress(),
      await strategyManager.getAddress(),
      await rebalanceExecutor.getAddress()
    );

    // Update addresses in strategy manager and rebalance executor
    await strategyManager.connect(owner).setVault(await vault.getAddress());
    await strategyManager.connect(owner).setRebalanceExecutor(await rebalanceExecutor.getAddress());
    await rebalanceExecutor.connect(owner).setVault(await vault.getAddress());
    await rebalanceExecutor.connect(owner).setStrategyManager(await strategyManager.getAddress());

    // Transfer some assets to users for testing
    await asset.transfer(user1.address, ethers.parseUnits("10000", 6));
    await asset.transfer(user2.address, ethers.parseUnits("10000", 6));
  });

  describe("Deployment", function () {
    it("Should set the correct asset token", async function () {
      expect(await vault.asset()).to.equal(await asset.getAddress());
    });

    it("Should set the correct reward token", async function () {
      expect(await vault.rewardToken()).to.equal(await rewardToken.getAddress());
    });

    it("Should set the correct strategy manager", async function () {
      expect(await vault.strategyManager()).to.equal(await strategyManager.getAddress());
    });

    it("Should set the correct rebalance executor", async function () {
      expect(await vault.rebalanceExecutor()).to.equal(await rebalanceExecutor.getAddress());
    });

    it("Should initialize with zero total assets and shares", async function () {
      expect(await vault.totalAssets()).to.equal(0);
      expect(await vault.totalShares()).to.equal(0);
    });
  });

  describe("Deposits", function () {
    it("Should allow valid deposits", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      
      await asset.connect(user1).approve(await vault.getAddress(), depositAmount);
      
      await expect(vault.connect(user1).deposit(depositAmount))
        .to.emit(vault, "Deposit")
        .withArgs(user1.address, depositAmount, depositAmount);

      expect(await vault.balances(user1.address)).to.equal(depositAmount);
      expect(await vault.totalAssets()).to.equal(depositAmount);
      expect(await vault.totalShares()).to.equal(depositAmount);
    });

    it("Should reject deposits below minimum", async function () {
      const depositAmount = ethers.parseUnits("50", 6); // Below 100 USDC minimum
      
      await asset.connect(user1).approve(await vault.getAddress(), depositAmount);
      
      await expect(vault.connect(user1).deposit(depositAmount))
        .to.be.revertedWith("Deposit too small");
    });

    it("Should reject deposits when paused", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      
      await vault.pause();
      
      await asset.connect(user1).approve(await vault.getAddress(), depositAmount);
      
      await expect(vault.connect(user1).deposit(depositAmount))
        .to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      // Make a deposit first
      const depositAmount = ethers.parseUnits("1000", 6);
      await asset.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount);
    });

    it("Should allow withdrawals after lock period", async function () {
      const withdrawShares = ethers.parseUnits("500", 6);
      
      // Fast forward time to pass lock period
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600 + 1]); // 7 days + 1 second
      await ethers.provider.send("evm_mine");
      
      await expect(vault.connect(user1).withdraw(withdrawShares))
        .to.emit(vault, "Withdraw")
        .withArgs(user1.address, withdrawShares, withdrawShares);

      expect(await vault.balances(user1.address)).to.equal(ethers.parseUnits("500", 6));
      expect(await vault.totalAssets()).to.equal(ethers.parseUnits("500", 6));
      expect(await vault.totalShares()).to.equal(ethers.parseUnits("500", 6));
    });

    it("Should reject withdrawals during lock period", async function () {
      const withdrawShares = ethers.parseUnits("500", 6);
      
      await expect(vault.connect(user1).withdraw(withdrawShares))
        .to.be.revertedWith("Funds are locked");
    });

    it("Should reject withdrawals exceeding balance", async function () {
      const withdrawShares = ethers.parseUnits("1500", 6); // More than deposited
      
      // Fast forward time to pass lock period
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600 + 1]);
      await ethers.provider.send("evm_mine");
      
      await expect(vault.connect(user1).withdraw(withdrawShares))
        .to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Strategy Execution", function () {
    beforeEach(async function () {
      // Make a deposit first
      const depositAmount = ethers.parseUnits("1000", 6);
      await asset.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount);
    });

    it("Should allow strategy execution by strategy manager", async function () {
      const strategyAmount = ethers.parseUnits("500", 6);
      
      // Set the strategy manager address to owner for testing
      await vault.connect(owner).setStrategyManager(owner.address);
      
      await expect(vault.connect(owner).executeStrategy(user2.address, strategyAmount))
        .to.emit(vault, "StrategyExecuted")
        .withArgs(user2.address, strategyAmount);

      expect(await vault.totalAssets()).to.equal(ethers.parseUnits("1000", 6)); // Should remain the same
    });

    it("Should reject strategy execution by non-strategy manager", async function () {
      const strategyAmount = ethers.parseUnits("500", 6);
      
      await expect(vault.connect(user1).executeStrategy(user2.address, strategyAmount))
        .to.be.revertedWith("Only strategy manager");
    });

    it("Should reject strategy execution exceeding vault balance", async function () {
      const strategyAmount = ethers.parseUnits("1500", 6); // More than available
      
      // Set the strategy manager address to owner for testing
      await vault.connect(owner).setStrategyManager(owner.address);
      
      await expect(vault.connect(owner).executeStrategy(user2.address, strategyAmount))
        .to.be.revertedWith("Insufficient vault balance");
    });
  });

  describe("Rebalancing", function () {
    beforeEach(async function () {
      // Make a deposit first
      const depositAmount = ethers.parseUnits("1000", 6);
      await asset.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount);
    });

    it("Should allow rebalancing by rebalance executor", async function () {
      const strategies = [user2.address, user1.address];
      const amounts = [ethers.parseUnits("300", 6), ethers.parseUnits("200", 6)];
      
      // Set the rebalance executor address to owner for testing
      await vault.connect(owner).setRebalanceExecutor(owner.address);
      
      await expect(vault.connect(owner).rebalance(strategies, amounts))
        .to.emit(vault, "RebalanceExecuted");

      expect(await vault.totalAssets()).to.equal(ethers.parseUnits("1000", 6)); // Should remain the same
    });

    it("Should reject rebalancing by non-rebalance executor", async function () {
      const strategies = [user2.address];
      const amounts = [ethers.parseUnits("300", 6)];
      
      await expect(vault.connect(user1).rebalance(strategies, amounts))
        .to.be.revertedWith("Only rebalance executor");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update strategy manager", async function () {
      const newStrategyManager = user2.address;
      
      await vault.setStrategyManager(newStrategyManager);
      expect(await vault.strategyManager()).to.equal(newStrategyManager);
    });

    it("Should allow owner to update rebalance executor", async function () {
      const newRebalanceExecutor = user2.address;
      
      await vault.setRebalanceExecutor(newRebalanceExecutor);
      expect(await vault.rebalanceExecutor()).to.equal(newRebalanceExecutor);
    });

    it("Should allow owner to pause and unpause", async function () {
      await vault.pause();
      expect(await vault.paused()).to.be.true;
      
      await vault.unpause();
      expect(await vault.paused()).to.be.false;
    });

    it("Should allow owner to perform emergency withdrawal", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      await asset.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount);
      
      const emergencyAmount = ethers.parseUnits("500", 6);
      await expect(vault.emergencyWithdraw(emergencyAmount))
        .to.not.be.reverted;
    });

    it("Should reject non-owner admin functions", async function () {
      await expect(vault.connect(user1).setStrategyManager(user2.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
      
      await expect(vault.connect(user1).pause())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Make deposits from multiple users
      const depositAmount1 = ethers.parseUnits("1000", 6);
      const depositAmount2 = ethers.parseUnits("2000", 6);
      
      await asset.connect(user1).approve(await vault.getAddress(), depositAmount1);
      await asset.connect(user2).approve(await vault.getAddress(), depositAmount2);
      
      await vault.connect(user1).deposit(depositAmount1);
      await vault.connect(user2).deposit(depositAmount2);
    });

    it("Should calculate user share correctly", async function () {
      const user1Share = await vault.getUserShare(user1.address);
      const user2Share = await vault.getUserShare(user2.address);
      
      expect(user1Share).to.equal(3333); // 1000/3000 * 10000
      expect(user2Share).to.equal(6666); // 2000/3000 * 10000
    });

    it("Should return correct TVL", async function () {
      const tvl = await vault.getTVL();
      expect(tvl).to.equal(ethers.parseUnits("3000", 6));
    });

    it("Should correctly identify locked funds", async function () {
      expect(await vault.isLocked(user1.address)).to.be.true;
      expect(await vault.isLocked(user2.address)).to.be.true;
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600 + 1]);
      await ethers.provider.send("evm_mine");
      
      expect(await vault.isLocked(user1.address)).to.be.false;
      expect(await vault.isLocked(user2.address)).to.be.false;
    });
  });
});