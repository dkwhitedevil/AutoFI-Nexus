// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title AutoFiVault
 * @dev Main vault contract for automated DeFi yield farming
 * @notice Manages user deposits, withdrawals, and automated strategy execution
 */
contract AutoFiVault is ReentrancyGuard, Ownable, Pausable {
    
    // ============ State Variables ============
    
    IERC20 public immutable asset; // The underlying asset (e.g., USDC, DAI)
    IERC20 public immutable rewardToken; // Token used for rewards (e.g., AUTO)
    
    mapping(address => uint256) public balances;
    mapping(address => uint256) public lastDepositTime;
    
    uint256 public totalAssets;
    uint256 public totalShares;
    uint256 public constant MIN_DEPOSIT = 100e6; // Minimum deposit (100 USDC)
    uint256 public constant LOCK_PERIOD = 7 days; // 7-day lock period
    
    address public strategyManager;
    address public rebalanceExecutor;
    
    // ============ Events ============
    
    event Deposit(address indexed user, uint256 amount, uint256 shares);
    event Withdraw(address indexed user, uint256 amount, uint256 shares);
    event StrategyExecuted(address indexed strategy, uint256 amount);
    event RebalanceExecuted(uint256 timestamp);
    event RewardsDistributed(uint256 totalRewards);
    
    // ============ Modifiers ============
    
    modifier onlyStrategyManager() {
        require(msg.sender == strategyManager, "Only strategy manager");
        _;
    }
    
    modifier onlyRebalanceExecutor() {
        require(msg.sender == rebalanceExecutor, "Only rebalance executor");
        _;
    }
    
    modifier notLocked(address user) {
        require(
            block.timestamp >= lastDepositTime[user] + LOCK_PERIOD,
            "Funds are locked"
        );
        _;
    }
    
    // ============ Constructor ============
    
    constructor(
        address _asset,
        address _rewardToken,
        address _strategyManager,
        address _rebalanceExecutor
    ) {
        asset = IERC20(_asset);
        rewardToken = IERC20(_rewardToken);
        strategyManager = _strategyManager;
        rebalanceExecutor = _rebalanceExecutor;
    }
    
    // ============ Core Functions ============
    
    /**
     * @dev Deposit assets into the vault
     * @param amount Amount of assets to deposit
     * @return shares Number of shares minted
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused returns (uint256 shares) {
        require(amount >= MIN_DEPOSIT, "Deposit too small");
        
        // Transfer assets from user
        require(asset.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Calculate shares (1:1 for simplicity, can be enhanced)
        shares = amount;
        
        // Update state
        balances[msg.sender] += shares;
        totalShares += shares;
        totalAssets += amount;
        lastDepositTime[msg.sender] = block.timestamp;
        
        emit Deposit(msg.sender, amount, shares);
        
        return shares;
    }
    
    /**
     * @dev Withdraw assets from the vault
     * @param shares Number of shares to redeem
     * @return amount Amount of assets withdrawn
     */
    function withdraw(uint256 shares) external nonReentrant notLocked(msg.sender) returns (uint256 amount) {
        require(shares <= balances[msg.sender], "Insufficient balance");
        require(shares <= totalShares, "Insufficient total shares");
        
        // Calculate withdrawal amount
        amount = (shares * totalAssets) / totalShares;
        
        // Update state
        balances[msg.sender] -= shares;
        totalShares -= shares;
        totalAssets -= amount;
        
        // Transfer assets to user
        require(asset.transfer(msg.sender, amount), "Transfer failed");
        
        emit Withdraw(msg.sender, amount, shares);
        
        return amount;
    }
    
    /**
     * @dev Execute a yield farming strategy
     * @param strategy Address of the strategy contract
     * @param amount Amount to invest in the strategy
     */
    function executeStrategy(address strategy, uint256 amount) external onlyStrategyManager {
        require(amount <= totalAssets, "Insufficient vault balance");
        require(strategy != address(0), "Invalid strategy");
        
        // Transfer assets to strategy
        require(asset.transfer(strategy, amount), "Strategy transfer failed");
        
        emit StrategyExecuted(strategy, amount);
    }
    
    /**
     * @dev Execute rebalancing across strategies
     * @param strategies Array of strategy addresses
     * @param amounts Array of amounts for each strategy
     */
    function rebalance(address[] calldata strategies, uint256[] calldata amounts) 
        external 
        onlyRebalanceExecutor 
    {
        require(strategies.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalAmount;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(totalAmount <= totalAssets, "Insufficient vault balance");
        
        // Execute rebalancing
        for (uint256 i = 0; i < strategies.length; i++) {
            if (amounts[i] > 0) {
                require(asset.transfer(strategies[i], amounts[i]), "Rebalance transfer failed");
            }
        }
        
        emit RebalanceExecuted(block.timestamp);
    }
    
    /**
     * @dev Distribute rewards to vault participants
     * @param totalRewards Total amount of rewards to distribute
     */
    function distributeRewards(uint256 totalRewards) external onlyOwner {
        require(totalRewards > 0, "No rewards to distribute");
        require(totalShares > 0, "No shares to distribute to");
        
        // Transfer reward tokens to vault
        require(rewardToken.transferFrom(msg.sender, address(this), totalRewards), "Reward transfer failed");
        
        emit RewardsDistributed(totalRewards);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get user's share of the vault
     * @param user Address of the user
     * @return share Percentage share (in basis points)
     */
    function getUserShare(address user) external view returns (uint256 share) {
        if (totalShares == 0) return 0;
        return (balances[user] * 10000) / totalShares;
    }
    
    /**
     * @dev Get vault's total value locked (TVL)
     * @return tvl Total value locked in the vault
     */
    function getTVL() external view returns (uint256 tvl) {
        return totalAssets;
    }
    
    /**
     * @dev Check if user's funds are locked
     * @param user Address of the user
     * @return locked True if funds are locked
     */
    function isLocked(address user) external view returns (bool locked) {
        return block.timestamp < lastDepositTime[user] + LOCK_PERIOD;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Update strategy manager address
     * @param newStrategyManager New strategy manager address
     */
    function setStrategyManager(address newStrategyManager) external onlyOwner {
        require(newStrategyManager != address(0), "Invalid address");
        strategyManager = newStrategyManager;
    }
    
    /**
     * @dev Update rebalance executor address
     * @param newRebalanceExecutor New rebalance executor address
     */
    function setRebalanceExecutor(address newRebalanceExecutor) external onlyOwner {
        require(newRebalanceExecutor != address(0), "Invalid address");
        rebalanceExecutor = newRebalanceExecutor;
    }
    
    /**
     * @dev Pause the vault
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the vault
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdrawal function
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(asset.transfer(owner(), amount), "Emergency withdrawal failed");
    }
}