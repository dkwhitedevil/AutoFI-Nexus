const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StrategyManager", function () {
  let strategyManager;
  let vault;
  let rebalanceExecutor;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy vault and rebalance executor
    const AutoFiVault = await ethers.getContractFactory("AutoFiVault");
    const RebalanceExecutor = await ethers.getContractFactory("RebalanceExecutor");

    vault = await AutoFiVault.deploy(
      ethers.ZeroAddress, // Will be set later
      ethers.ZeroAddress, // Will be set later
      ethers.ZeroAddress, // Will be set later
      ethers.ZeroAddress  // Will be set later
    );

    rebalanceExecutor = await RebalanceExecutor.deploy(
      ethers.ZeroAddress,
      ethers.ZeroAddress,
      1000, // 10% rebalance threshold
      ethers.parseEther("1000"), // max rebalance amount
      3600 // 1 hour cooldown
    );

    // Deploy strategy manager
    const StrategyManager = await ethers.getContractFactory("StrategyManager");
    strategyManager = await StrategyManager.deploy(
      await vault.getAddress(),
      await rebalanceExecutor.getAddress()
    );
  });

  describe("Deployment", function () {
    it("Should set the correct vault address", async function () {
      expect(await strategyManager.vault()).to.equal(await vault.getAddress());
    });

    it("Should set the correct rebalance executor address", async function () {
      expect(await strategyManager.rebalanceExecutor()).to.equal(await rebalanceExecutor.getAddress());
    });

    it("Should initialize with zero total allocation", async function () {
      expect(await strategyManager.totalAllocation()).to.equal(0);
    });

    it("Should initialize with zero active strategies", async function () {
      expect(await strategyManager.getActiveStrategyCount()).to.equal(0);
    });
  });

  describe("Strategy Registration", function () {
    it("Should allow owner to register a new strategy", async function () {
      const strategyAddress = user1.address;
      const name = "Test Strategy";
      const maxAllocation = 5000; // 50%

      await expect(strategyManager.registerStrategy(strategyAddress, name, maxAllocation))
        .to.emit(strategyManager, "StrategyRegistered")
        .withArgs(strategyAddress, name, maxAllocation);

      const strategy = await strategyManager.getStrategy(strategyAddress);
      expect(strategy.strategyAddress).to.equal(strategyAddress);
      expect(strategy.name).to.equal(name);
      expect(strategy.maxAllocation).to.equal(maxAllocation);
      expect(strategy.isActive).to.be.false;
    });

    it("Should reject registration with invalid address", async function () {
      await expect(strategyManager.registerStrategy(
        ethers.ZeroAddress,
        "Test Strategy",
        5000
      )).to.be.revertedWith("Invalid strategy address");
    });

    it("Should reject registration with max allocation > 100%", async function () {
      await expect(strategyManager.registerStrategy(
        user1.address,
        "Test Strategy",
        10001 // > 100%
      )).to.be.revertedWith("Max allocation too high");
    });

    it("Should reject registration by non-owner", async function () {
      await expect(strategyManager.connect(user1).registerStrategy(
        user2.address,
        "Test Strategy",
        5000
      )).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Strategy Activation", function () {
    beforeEach(async function () {
      // Register a strategy first
      await strategyManager.registerStrategy(user1.address, "Test Strategy", 5000);
    });

    it("Should allow owner to activate a strategy", async function () {
      await expect(strategyManager.activateStrategy(user1.address))
        .to.emit(strategyManager, "StrategyActivated")
        .withArgs(user1.address);

      const strategy = await strategyManager.getStrategy(user1.address);
      expect(strategy.isActive).to.be.true;

      const activeStrategies = await strategyManager.getActiveStrategies();
      expect(activeStrategies.length).to.equal(1);
      expect(activeStrategies[0]).to.equal(user1.address);
    });

    it("Should reject activation of unregistered strategy", async function () {
      await expect(strategyManager.activateStrategy(user2.address))
        .to.be.revertedWith("Strategy not registered");
    });

    it("Should reject activation of already active strategy", async function () {
      await strategyManager.activateStrategy(user1.address);
      
      await expect(strategyManager.activateStrategy(user1.address))
        .to.be.revertedWith("Strategy already active");
    });
  });

  describe("Strategy Deactivation", function () {
    beforeEach(async function () {
      // Register and activate a strategy
      await strategyManager.registerStrategy(user1.address, "Test Strategy", 5000);
      await strategyManager.activateStrategy(user1.address);
    });

    it("Should allow owner to deactivate a strategy", async function () {
      await expect(strategyManager.deactivateStrategy(user1.address))
        .to.emit(strategyManager, "StrategyDeactivated")
        .withArgs(user1.address);

      const strategy = await strategyManager.getStrategy(user1.address);
      expect(strategy.isActive).to.be.false;

      const activeStrategies = await strategyManager.getActiveStrategies();
      expect(activeStrategies.length).to.equal(0);
    });

    it("Should reject deactivation of inactive strategy", async function () {
      await strategyManager.deactivateStrategy(user1.address);
      
      await expect(strategyManager.deactivateStrategy(user1.address))
        .to.be.revertedWith("Strategy not active");
    });
  });

  describe("Allocation Management", function () {
    beforeEach(async function () {
      // Register and activate a strategy
      await strategyManager.registerStrategy(user1.address, "Test Strategy", 5000);
      await strategyManager.activateStrategy(user1.address);
    });

    it("Should allow owner to update allocation", async function () {
      const newAllocation = 3000; // 30%

      await expect(strategyManager.updateAllocation(user1.address, newAllocation))
        .to.emit(strategyManager, "AllocationUpdated")
        .withArgs(user1.address, 0, newAllocation);

      expect(await strategyManager.getAllocation(user1.address)).to.equal(newAllocation);
      expect(await strategyManager.totalAllocation()).to.equal(newAllocation);
    });

    it("Should reject allocation exceeding maximum", async function () {
      const newAllocation = 6000; // 60% > 50% max

      await expect(strategyManager.updateAllocation(user1.address, newAllocation))
        .to.be.revertedWith("Allocation exceeds maximum");
    });

    it("Should reject total allocation exceeding 100%", async function () {
      // Register and activate another strategy with higher max allocation
      await strategyManager.registerStrategy(user2.address, "Test Strategy 2", 8000);
      await strategyManager.activateStrategy(user2.address);
      
      // Set first strategy to 50% (its maximum)
      await strategyManager.updateAllocation(user1.address, 5000);
      
      // Try to set second strategy to 60% (total would be 110%)
      await expect(strategyManager.updateAllocation(user2.address, 6000))
        .to.be.revertedWith("Total allocation exceeds 100%");
    });
  });

  describe("Strategy Execution", function () {
    beforeEach(async function () {
      // Register and activate a strategy
      await strategyManager.registerStrategy(user1.address, "Test Strategy", 5000);
      await strategyManager.activateStrategy(user1.address);
    });

    it("Should allow vault to execute strategy", async function () {
      const amount = ethers.parseEther("100");

      // Set the vault address to owner for testing
      await strategyManager.connect(owner).setVault(owner.address);
      
      await expect(strategyManager.connect(owner).executeStrategy(user1.address, amount))
        .to.not.be.reverted;

      const strategy = await strategyManager.getStrategy(user1.address);
      expect(strategy.totalDeposited).to.equal(amount);
      expect(strategy.lastRebalanceTime).to.be.greaterThan(0);
    });

    it("Should reject execution by non-vault", async function () {
      const amount = ethers.parseEther("100");

      await expect(strategyManager.connect(user1).executeStrategy(user1.address, amount))
        .to.be.revertedWith("Only vault can call");
    });

    it("Should reject execution of inactive strategy", async function () {
      await strategyManager.deactivateStrategy(user1.address);
      
      const amount = ethers.parseEther("100");

      // Set the vault address to owner for testing
      await strategyManager.connect(owner).setVault(owner.address);

      await expect(strategyManager.connect(owner).executeStrategy(user1.address, amount))
        .to.be.revertedWith("Strategy not active");
    });
  });

  describe("Performance Tracking", function () {
    beforeEach(async function () {
      // Register and activate a strategy
      await strategyManager.registerStrategy(user1.address, "Test Strategy", 5000);
      await strategyManager.activateStrategy(user1.address);
    });

    it("Should allow rebalance executor to update performance", async function () {
      const newAPY = 800; // 8%
      const performanceScore = 85;

      // Set the rebalance executor address to owner for testing
      await strategyManager.connect(owner).setRebalanceExecutor(owner.address);

      await expect(strategyManager.connect(owner).updatePerformance(
        user1.address,
        newAPY,
        performanceScore
      )).to.emit(strategyManager, "PerformanceUpdated")
        .withArgs(user1.address, newAPY, performanceScore);

      const strategy = await strategyManager.getStrategy(user1.address);
      expect(strategy.performanceScore).to.equal(performanceScore);
    });

    it("Should reject performance update by non-rebalance executor", async function () {
      await expect(strategyManager.connect(user1).updatePerformance(
        user1.address,
        800,
        85
      )).to.be.revertedWith("Only rebalance executor");
    });

    it("Should reject performance score > 100", async function () {
      // Set the rebalance executor address to owner for testing
      await strategyManager.connect(owner).setRebalanceExecutor(owner.address);
      
      await expect(strategyManager.connect(owner).updatePerformance(
        user1.address,
        800,
        101
      )).to.be.revertedWith("Performance score too high");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Register and activate multiple strategies
      await strategyManager.registerStrategy(user1.address, "Strategy 1", 4000);
      await strategyManager.registerStrategy(user2.address, "Strategy 2", 3000);
      
      await strategyManager.activateStrategy(user1.address);
      await strategyManager.activateStrategy(user2.address);
    });

    it("Should return correct active strategy count", async function () {
      expect(await strategyManager.getActiveStrategyCount()).to.equal(2);
    });

    it("Should return correct active strategies", async function () {
      const activeStrategies = await strategyManager.getActiveStrategies();
      expect(activeStrategies.length).to.equal(2);
      expect(activeStrategies).to.include(user1.address);
      expect(activeStrategies).to.include(user2.address);
    });

    it("Should correctly identify performing strategies", async function () {
      // Set the rebalance executor address to owner for testing
      await strategyManager.connect(owner).setRebalanceExecutor(owner.address);
      
      // Set performance scores
      await strategyManager.connect(owner).updatePerformance(user1.address, 500, 75);
      await strategyManager.connect(owner).updatePerformance(user2.address, 300, 25);

      expect(await strategyManager.isPerformingWell(user1.address)).to.be.true;
      expect(await strategyManager.isPerformingWell(user2.address)).to.be.false;
    });

    it("Should return correct performance metrics", async function () {
      const apy = 800;
      const performanceScore = 85;

      // Set the rebalance executor address to owner for testing
      await strategyManager.connect(owner).setRebalanceExecutor(owner.address);

      await strategyManager.connect(owner).updatePerformance(
        user1.address,
        apy,
        performanceScore
      );

      const [returnedAPY, returnedScore, lastUpdate] = await strategyManager.getPerformanceMetrics(user1.address);
      
      expect(returnedAPY).to.equal(apy);
      expect(returnedScore).to.equal(performanceScore);
      expect(lastUpdate).to.be.greaterThan(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update vault address", async function () {
      await strategyManager.setVault(user1.address);
      expect(await strategyManager.vault()).to.equal(user1.address);
    });

    it("Should allow owner to update rebalance executor", async function () {
      await strategyManager.setRebalanceExecutor(user1.address);
      expect(await strategyManager.rebalanceExecutor()).to.equal(user1.address);
    });

    it("Should allow owner to pause and unpause", async function () {
      await strategyManager.pause();
      expect(await strategyManager.paused()).to.be.true;
      
      await strategyManager.unpause();
      expect(await strategyManager.paused()).to.be.false;
    });

    it("Should allow owner to emergency reset allocations", async function () {
      // Register and activate a strategy with allocation
      await strategyManager.registerStrategy(user1.address, "Test Strategy", 5000);
      await strategyManager.activateStrategy(user1.address);
      await strategyManager.updateAllocation(user1.address, 3000);

      expect(await strategyManager.totalAllocation()).to.equal(3000);

      await strategyManager.emergencyResetAllocations();
      expect(await strategyManager.totalAllocation()).to.equal(0);
      expect(await strategyManager.getAllocation(user1.address)).to.equal(0);
    });

    it("Should reject non-owner admin functions", async function () {
      await expect(strategyManager.connect(user1).setVault(user2.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
      
      await expect(strategyManager.connect(user1).pause())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});