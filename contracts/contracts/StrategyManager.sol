// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title StrategyManager
 * @dev Manages multiple yield farming strategies and their allocation
 * @notice Handles strategy registration, allocation, and performance tracking
 */
contract StrategyManager is Ownable, Pausable, ReentrancyGuard {
    
    // ============ Structs ============
    
    struct Strategy {
        address strategyAddress;
        string name;
        uint256 allocation; // Allocation percentage (in basis points)
        uint256 maxAllocation; // Maximum allocation percentage
        bool isActive;
        uint256 totalDeposited;
        uint256 totalWithdrawn;
        uint256 lastRebalanceTime;
        uint256 performanceScore; // Performance metric (0-100)
    }
    
    // ============ State Variables ============
    
    mapping(address => Strategy) public strategies;
    address[] public activeStrategies;
    
    uint256 public constant MAX_STRATEGIES = 10;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public totalAllocation;
    
    address public vault;
    address public rebalanceExecutor;
    
    // Strategy performance tracking
    mapping(address => uint256) public strategyAPY;
    mapping(address => uint256) public lastAPYUpdate;
    
    // ============ Events ============
    
    event StrategyRegistered(address indexed strategy, string name, uint256 maxAllocation);
    event StrategyActivated(address indexed strategy);
    event StrategyDeactivated(address indexed strategy);
    event AllocationUpdated(address indexed strategy, uint256 oldAllocation, uint256 newAllocation);
    event RebalanceTriggered(uint256 timestamp);
    event PerformanceUpdated(address indexed strategy, uint256 newAPY, uint256 performanceScore);
    
    // ============ Modifiers ============
    
    modifier onlyVault() {
        require(msg.sender == vault, "Only vault can call");
        _;
    }
    
    modifier onlyRebalanceExecutor() {
        require(msg.sender == rebalanceExecutor, "Only rebalance executor");
        _;
    }
    
    modifier validStrategy(address strategy) {
        require(strategies[strategy].strategyAddress != address(0), "Strategy not registered");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _vault, address _rebalanceExecutor) {
        vault = _vault;
        rebalanceExecutor = _rebalanceExecutor;
    }
    
    // ============ Strategy Management ============
    
    /**
     * @dev Register a new strategy
     * @param strategy Address of the strategy contract
     * @param name Name of the strategy
     * @param maxAllocation Maximum allocation percentage (in basis points)
     */
    function registerStrategy(
        address strategy,
        string calldata name,
        uint256 maxAllocation
    ) external onlyOwner {
        require(strategy != address(0), "Invalid strategy address");
        require(maxAllocation <= BASIS_POINTS, "Max allocation too high");
        require(activeStrategies.length < MAX_STRATEGIES, "Too many strategies");
        require(strategies[strategy].strategyAddress == address(0), "Strategy already registered");
        
        strategies[strategy] = Strategy({
            strategyAddress: strategy,
            name: name,
            allocation: 0,
            maxAllocation: maxAllocation,
            isActive: false,
            totalDeposited: 0,
            totalWithdrawn: 0,
            lastRebalanceTime: 0,
            performanceScore: 50 // Default performance score
        });
        
        emit StrategyRegistered(strategy, name, maxAllocation);
    }
    
    /**
     * @dev Activate a strategy
     * @param strategy Address of the strategy to activate
     */
    function activateStrategy(address strategy) external onlyOwner validStrategy(strategy) {
        require(!strategies[strategy].isActive, "Strategy already active");
        
        strategies[strategy].isActive = true;
        activeStrategies.push(strategy);
        
        emit StrategyActivated(strategy);
    }
    
    /**
     * @dev Deactivate a strategy
     * @param strategy Address of the strategy to deactivate
     */
    function deactivateStrategy(address strategy) external onlyOwner validStrategy(strategy) {
        require(strategies[strategy].isActive, "Strategy not active");
        
        strategies[strategy].isActive = false;
        
        // Remove from active strategies array
        for (uint256 i = 0; i < activeStrategies.length; i++) {
            if (activeStrategies[i] == strategy) {
                activeStrategies[i] = activeStrategies[activeStrategies.length - 1];
                activeStrategies.pop();
                break;
            }
        }
        
        emit StrategyDeactivated(strategy);
    }
    
    /**
     * @dev Update strategy allocation
     * @param strategy Address of the strategy
     * @param newAllocation New allocation percentage (in basis points)
     */
    function updateAllocation(address strategy, uint256 newAllocation) 
        external 
        onlyOwner 
        validStrategy(strategy) 
    {
        require(newAllocation <= strategies[strategy].maxAllocation, "Allocation exceeds maximum");
        
        uint256 oldAllocation = strategies[strategy].allocation;
        
        // Update total allocation
        totalAllocation = totalAllocation - oldAllocation + newAllocation;
        require(totalAllocation <= BASIS_POINTS, "Total allocation exceeds 100%");
        
        strategies[strategy].allocation = newAllocation;
        
        emit AllocationUpdated(strategy, oldAllocation, newAllocation);
    }
    
    // ============ Strategy Execution ============
    
    /**
     * @dev Execute investment in a strategy
     * @param strategy Address of the strategy
     * @param amount Amount to invest
     */
    function executeStrategy(address strategy, uint256 amount) external onlyVault validStrategy(strategy) {
        require(strategies[strategy].isActive, "Strategy not active");
        require(amount > 0, "Amount must be positive");
        
        strategies[strategy].totalDeposited += amount;
        strategies[strategy].lastRebalanceTime = block.timestamp;
    }
    
    /**
     * @dev Record strategy withdrawal
     * @param strategy Address of the strategy
     * @param amount Amount withdrawn
     */
    function recordWithdrawal(address strategy, uint256 amount) external onlyVault validStrategy(strategy) {
        require(amount > 0, "Amount must be positive");
        
        strategies[strategy].totalWithdrawn += amount;
    }
    
    // ============ Performance Tracking ============
    
    /**
     * @dev Update strategy performance metrics
     * @param strategy Address of the strategy
     * @param newAPY New APY percentage (in basis points)
     * @param performanceScore New performance score (0-100)
     */
    function updatePerformance(
        address strategy, 
        uint256 newAPY, 
        uint256 performanceScore
    ) external onlyRebalanceExecutor validStrategy(strategy) {
        require(performanceScore <= 100, "Performance score too high");
        
        strategyAPY[strategy] = newAPY;
        strategies[strategy].performanceScore = performanceScore;
        lastAPYUpdate[strategy] = block.timestamp;
        
        emit PerformanceUpdated(strategy, newAPY, performanceScore);
    }
    
    /**
     * @dev Trigger rebalancing based on performance
     */
    function triggerRebalance() external onlyRebalanceExecutor {
        emit RebalanceTriggered(block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get all active strategies
     * @return strategies Array of active strategy addresses
     */
    function getActiveStrategies() external view returns (address[] memory) {
        return activeStrategies;
    }
    
    /**
     * @dev Get strategy details
     * @param strategy Address of the strategy
     * @return Strategy struct with all details
     */
    function getStrategy(address strategy) external view validStrategy(strategy) returns (Strategy memory) {
        return strategies[strategy];
    }
    
    /**
     * @dev Get allocation for a specific strategy
     * @param strategy Address of the strategy
     * @return allocation Allocation percentage
     */
    function getAllocation(address strategy) external view validStrategy(strategy) returns (uint256) {
        return strategies[strategy].allocation;
    }
    
    /**
     * @dev Get total number of active strategies
     * @return count Number of active strategies
     */
    function getActiveStrategyCount() external view returns (uint256) {
        return activeStrategies.length;
    }
    
    /**
     * @dev Check if a strategy is performing well
     * @param strategy Address of the strategy
     * @return performing True if performance score > 70
     */
    function isPerformingWell(address strategy) external view validStrategy(strategy) returns (bool) {
        return strategies[strategy].performanceScore > 70;
    }
    
    /**
     * @dev Get strategy performance metrics
     * @param strategy Address of the strategy
     * @return apy Current APY
     * @return performanceScore Current performance score
     * @return lastUpdate Timestamp of last update
     */
    function getPerformanceMetrics(address strategy) 
        external 
        view 
        validStrategy(strategy) 
        returns (uint256 apy, uint256 performanceScore, uint256 lastUpdate) 
    {
        return (
            strategyAPY[strategy],
            strategies[strategy].performanceScore,
            lastAPYUpdate[strategy]
        );
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Update vault address
     * @param newVault New vault address
     */
    function setVault(address newVault) external onlyOwner {
        require(newVault != address(0), "Invalid vault address");
        vault = newVault;
    }
    
    /**
     * @dev Update rebalance executor address
     * @param newRebalanceExecutor New rebalance executor address
     */
    function setRebalanceExecutor(address newRebalanceExecutor) external onlyOwner {
        require(newRebalanceExecutor != address(0), "Invalid executor address");
        rebalanceExecutor = newRebalanceExecutor;
    }
    
    /**
     * @dev Pause the strategy manager
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the strategy manager
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency function to reset allocations
     */
    function emergencyResetAllocations() external onlyOwner {
        for (uint256 i = 0; i < activeStrategies.length; i++) {
            strategies[activeStrategies[i]].allocation = 0;
        }
        totalAllocation = 0;
    }
}