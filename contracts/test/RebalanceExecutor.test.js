const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RebalanceExecutor", function () {
  let rebalanceExecutor;
  let vault;
  let strategyManager;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy vault and strategy manager
    const AutoFiVault = await ethers.getContractFactory("AutoFiVault");
    const StrategyManager = await ethers.getContractFactory("StrategyManager");

    vault = await AutoFiVault.deploy(
      ethers.ZeroAddress, // Will be set later
      ethers.ZeroAddress, // Will be set later
      ethers.ZeroAddress, // Will be set later
      ethers.ZeroAddress  // Will be set later
    );

    strategyManager = await StrategyManager.deploy(
      await vault.getAddress(),
      ethers.ZeroAddress // Will be set later
    );

    // Deploy rebalance executor
    const RebalanceExecutor = await ethers.getContractFactory("RebalanceExecutor");
    rebalanceExecutor = await RebalanceExecutor.deploy(
      await vault.getAddress(),
      await strategyManager.getAddress(),
      1000, // 10% rebalance threshold
      ethers.parseEther("1000"), // max rebalance amount
      3600 // 1 hour cooldown
    );

    // Update addresses
    await strategyManager.setRebalanceExecutor(await rebalanceExecutor.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the correct vault address", async function () {
      expect(await rebalanceExecutor.vault()).to.equal(await vault.getAddress());
    });

    it("Should set the correct strategy manager address", async function () {
      expect(await rebalanceExecutor.strategyManager()).to.equal(await strategyManager.getAddress());
    });

    it("Should initialize with correct configuration", async function () {
      const config = await rebalanceExecutor.getConfig();
      expect(config.rebalanceThreshold).to.equal(1000);
      expect(config.maxRebalanceAmount).to.equal(ethers.parseEther("1000"));
      expect(config.cooldownPeriod).to.equal(3600);
      expect(config.autoRebalanceEnabled).to.be.true;
    });

    it("Should initialize with zero rebalance count", async function () {
      expect(await rebalanceExecutor.getRebalanceCount()).to.equal(0);
    });
  });

  describe("Rebalancing", function () {
    it("Should execute rebalancing when called by vault", async function () {
      const strategies = [user1.address, user2.address];
      const amounts = [ethers.parseEther("300"), ethers.parseEther("200")];
      const reason = "Performance rebalance";

      // Set the vault address to owner for testing
      await rebalanceExecutor.connect(owner).setVault(owner.address);

      await expect(rebalanceExecutor.connect(owner).executeRebalance(strategies, amounts, reason))
        .to.emit(rebalanceExecutor, "RebalanceExecuted");

      expect(await rebalanceExecutor.getRebalanceCount()).to.equal(1);
    });

    it("Should reject rebalancing by non-vault", async function () {
      const strategies = [user1.address];
      const amounts = [ethers.parseEther("300")];
      const reason = "Test rebalance";

      await expect(rebalanceExecutor.connect(user1).executeRebalance(strategies, amounts, reason))
        .to.be.revertedWith("Only vault can call");
    });

    it("Should reject rebalancing with mismatched array lengths", async function () {
      const strategies = [user1.address, user2.address];
      const amounts = [ethers.parseEther("300")]; // Missing one amount
      const reason = "Test rebalance";

      // Set the vault address to owner for testing
      await rebalanceExecutor.connect(owner).setVault(owner.address);

      await expect(rebalanceExecutor.connect(owner).executeRebalance(strategies, amounts, reason))
        .to.be.revertedWith("Arrays length mismatch");
    });

    it("Should reject rebalancing with empty strategies", async function () {
      const strategies = [];
      const amounts = [];
      const reason = "Test rebalance";

      // Set the vault address to owner for testing
      await rebalanceExecutor.connect(owner).setVault(owner.address);

      await expect(rebalanceExecutor.connect(owner).executeRebalance(strategies, amounts, reason))
        .to.be.revertedWith("No strategies provided");
    });

    it("Should reject rebalancing exceeding max amount", async function () {
      const strategies = [user1.address];
      const amounts = [ethers.parseEther("1500")]; // Exceeds max of 1000
      const reason = "Test rebalance";

      // Set the vault address to owner for testing
      await rebalanceExecutor.connect(owner).setVault(owner.address);

      await expect(rebalanceExecutor.connect(owner).executeRebalance(strategies, amounts, reason))
        .to.be.revertedWith("Amount exceeds max rebalance");
    });

    it("Should respect cooldown period", async function () {
      const strategies = [user1.address];
      const amounts = [ethers.parseEther("300")];
      const reason = "First rebalance";

      // Set the vault address to owner for testing
      await rebalanceExecutor.connect(owner).setVault(owner.address);

      // First rebalance should succeed
      await rebalanceExecutor.connect(owner).executeRebalance(strategies, amounts, reason);

      // Second rebalance should fail due to cooldown
      await expect(rebalanceExecutor.connect(owner).executeRebalance(strategies, amounts, reason))
        .to.be.revertedWith("Cooldown period not passed");

      // Fast forward time to pass cooldown
      await ethers.provider.send("evm_increaseTime", [3601]); // 1 hour + 1 second
      await ethers.provider.send("evm_mine");

      // Now second rebalance should succeed
      await expect(rebalanceExecutor.connect(owner).executeRebalance(strategies, amounts, reason))
        .to.not.be.reverted;
    });
  });

  describe("Auto Rebalancing", function () {
    it("Should trigger auto rebalance when called by strategy manager", async function () {
      // Set the strategy manager address to owner for testing
      await rebalanceExecutor.connect(owner).setStrategyManager(owner.address);
      
      await expect(rebalanceExecutor.connect(owner).triggerAutoRebalance())
        .to.emit(rebalanceExecutor, "RebalanceExecuted");
    });

    it("Should reject auto rebalance when disabled", async function () {
      await rebalanceExecutor.updateConfig(
        1000, // threshold
        ethers.parseEther("1000"), // max amount
        3600, // cooldown
        false // auto rebalance disabled
      );

      // Set the strategy manager address to owner for testing
      await rebalanceExecutor.connect(owner).setStrategyManager(owner.address);

      await expect(rebalanceExecutor.connect(owner).triggerAutoRebalance())
        .to.be.revertedWith("Auto rebalancing disabled");
    });

    it("Should reject auto rebalance by non-strategy manager", async function () {
      await expect(rebalanceExecutor.connect(user1).triggerAutoRebalance())
        .to.be.revertedWith("Only strategy manager");
    });
  });

  describe("Emergency Rebalancing", function () {
    it("Should allow owner to perform emergency rebalance", async function () {
      await expect(rebalanceExecutor.emergencyRebalance(user1.address, ethers.parseEther("500")))
        .to.emit(rebalanceExecutor, "EmergencyRebalance")
        .withArgs(user1.address, ethers.parseEther("500"));
    });

    it("Should reject emergency rebalance with invalid strategy", async function () {
      await expect(rebalanceExecutor.emergencyRebalance(ethers.ZeroAddress, ethers.parseEther("500")))
        .to.be.revertedWith("Invalid strategy");
    });

    it("Should reject emergency rebalance with zero amount", async function () {
      await expect(rebalanceExecutor.emergencyRebalance(user1.address, 0))
        .to.be.revertedWith("Amount must be positive");
    });

    it("Should reject emergency rebalance by non-owner", async function () {
      await expect(rebalanceExecutor.connect(user1).emergencyRebalance(user2.address, ethers.parseEther("500")))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Performance Analysis", function () {
    it("Should analyze performance and suggest rebalancing", async function () {
      const strategies = [user1.address, user2.address];
      
      const [shouldRebalance, reason] = await rebalanceExecutor.analyzePerformance(strategies);
      
      expect(shouldRebalance).to.be.true;
      expect(reason).to.equal("Performance analysis suggests rebalancing");
    });

    it("Should return false for empty strategies array", async function () {
      const strategies = [];
      
      const [shouldRebalance, reason] = await rebalanceExecutor.analyzePerformance(strategies);
      
      expect(shouldRebalance).to.be.false;
      expect(reason).to.equal("No strategies to analyze");
    });

    it("Should calculate optimal allocation", async function () {
      const strategies = [user1.address, user2.address];
      const currentAllocations = [6000, 4000]; // 60% and 40%
      
      const newAllocations = await rebalanceExecutor.calculateOptimalAllocation(strategies, currentAllocations);
      
      expect(newAllocations.length).to.equal(2);
      expect(newAllocations[0]).to.equal(5000); // 50%
      expect(newAllocations[1]).to.equal(5000); // 50%
    });

    it("Should reject calculation with mismatched arrays", async function () {
      const strategies = [user1.address, user2.address];
      const currentAllocations = [6000]; // Missing one allocation
      
      await expect(rebalanceExecutor.calculateOptimalAllocation(strategies, currentAllocations))
        .to.be.revertedWith("Arrays length mismatch");
    });
  });

  describe("Configuration", function () {
    it("Should allow owner to update configuration", async function () {
      const newThreshold = 2000;
      const newMaxAmount = ethers.parseEther("2000");
      const newCooldown = 7200;
      const newAutoEnabled = false;

      await expect(rebalanceExecutor.updateConfig(newThreshold, newMaxAmount, newCooldown, newAutoEnabled))
        .to.emit(rebalanceExecutor, "ConfigUpdated")
        .withArgs(newThreshold, newMaxAmount, newCooldown, newAutoEnabled);

      const config = await rebalanceExecutor.getConfig();
      expect(config.rebalanceThreshold).to.equal(newThreshold);
      expect(config.maxRebalanceAmount).to.equal(newMaxAmount);
      expect(config.cooldownPeriod).to.equal(newCooldown);
      expect(config.autoRebalanceEnabled).to.equal(newAutoEnabled);
    });

    it("Should reject threshold > 50%", async function () {
      await expect(rebalanceExecutor.updateConfig(
        5001, // > 50%
        ethers.parseEther("1000"),
        3600,
        true
      )).to.be.revertedWith("Threshold too high");
    });

    it("Should reject zero max amount", async function () {
      await expect(rebalanceExecutor.updateConfig(
        1000,
        0, // zero amount
        3600,
        true
      )).to.be.revertedWith("Max amount must be positive");
    });

    it("Should reject cooldown < 1 hour", async function () {
      await expect(rebalanceExecutor.updateConfig(
        1000,
        ethers.parseEther("1000"),
        3599, // < 1 hour
        true
      )).to.be.revertedWith("Cooldown too short");
    });

    it("Should reject configuration update by non-owner", async function () {
      await expect(rebalanceExecutor.connect(user1).updateConfig(
        2000,
        ethers.parseEther("2000"),
        7200,
        false
      )).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Execute a rebalance to create history
      const strategies = [user1.address];
      const amounts = [ethers.parseEther("300")];
      const reason = "Test rebalance";

      // Set the vault address to owner for testing
      await rebalanceExecutor.connect(owner).setVault(owner.address);

      await rebalanceExecutor.connect(owner).executeRebalance(strategies, amounts, reason);
    });

    it("Should return rebalance history", async function () {
      const history = await rebalanceExecutor.getRebalanceHistory(0);
      
      expect(history.timestamp).to.be.greaterThan(0);
      expect(history.totalAmount).to.equal(ethers.parseEther("300"));
      expect(history.strategies.length).to.equal(1);
      expect(history.strategies[0]).to.equal(user1.address);
      expect(history.amounts[0]).to.equal(ethers.parseEther("300"));
      expect(history.reason).to.equal("Test rebalance");
    });

    it("Should reject invalid rebalance ID", async function () {
      await expect(rebalanceExecutor.getRebalanceHistory(999))
        .to.be.revertedWith("Invalid rebalance ID");
    });

    it("Should check if rebalancing can be executed", async function () {
      const [canRebalance, timeRemaining] = await rebalanceExecutor.canExecuteRebalance();
      
      expect(canRebalance).to.be.false;
      expect(timeRemaining).to.be.greaterThan(0);
      expect(timeRemaining).to.be.lessThanOrEqual(3600);
    });

    it("Should allow rebalancing after cooldown", async function () {
      // Fast forward time to pass cooldown
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      const [canRebalance, timeRemaining] = await rebalanceExecutor.canExecuteRebalance();
      
      expect(canRebalance).to.be.true;
      expect(timeRemaining).to.equal(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update vault address", async function () {
      await rebalanceExecutor.setVault(user1.address);
      expect(await rebalanceExecutor.vault()).to.equal(user1.address);
    });

    it("Should allow owner to update strategy manager address", async function () {
      await rebalanceExecutor.setStrategyManager(user1.address);
      expect(await rebalanceExecutor.strategyManager()).to.equal(user1.address);
    });

    it("Should allow owner to pause and unpause", async function () {
      await rebalanceExecutor.pause();
      expect(await rebalanceExecutor.paused()).to.be.true;
      
      await rebalanceExecutor.unpause();
      expect(await rebalanceExecutor.paused()).to.be.false;
    });

    it("Should allow owner to reset history", async function () {
      // Execute a rebalance first
      const strategies = [user1.address];
      const amounts = [ethers.parseEther("300")];
      
      // Set the vault address to owner for testing
      await rebalanceExecutor.connect(owner).setVault(owner.address);
      
      await rebalanceExecutor.connect(owner).executeRebalance(strategies, amounts, "Test");

      expect(await rebalanceExecutor.getRebalanceCount()).to.equal(1);

      await rebalanceExecutor.resetHistory();
      expect(await rebalanceExecutor.getRebalanceCount()).to.equal(0);
    });

    it("Should reject non-owner admin functions", async function () {
      await expect(rebalanceExecutor.connect(user1).setVault(user2.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
      
      await expect(rebalanceExecutor.connect(user1).pause())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});