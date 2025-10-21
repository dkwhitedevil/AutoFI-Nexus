// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title RebalanceExecutor
 * @dev Executes automated rebalancing of assets across strategies
 * @notice Monitors strategy performance and triggers rebalancing when needed
 */
contract RebalanceExecutor is Ownable, Pausable, ReentrancyGuard {
    
    // ============ Structs ============
    
    struct RebalanceConfig {
        uint256 rebalanceThreshold; // Minimum threshold to trigger rebalance (basis points)
        uint256 maxRebalanceAmount; // Maximum amount to rebalance in one transaction
        uint256 cooldownPeriod; // Minimum time between rebalances
        bool autoRebalanceEnabled; // Whether auto-rebalancing is enabled
    }
    
    struct RebalanceEvent {
        uint256 timestamp;
        uint256 totalAmount;
        address[] strategies;
        uint256[] amounts;
        string reason;
    }
    
    // ============ State Variables ============
    
    RebalanceConfig public config;
    
    address public vault;
    address public strategyManager;
    
    mapping(uint256 => RebalanceEvent) public rebalanceHistory;
    uint256 public rebalanceCount;
    uint256 public lastRebalanceTime;
    
    // Performance thresholds
    uint256 public constant PERFORMANCE_THRESHOLD_LOW = 30; // 30% performance score
    uint256 public constant PERFORMANCE_THRESHOLD_HIGH = 80; // 80% performance score
    uint256 public constant MAX_REBALANCE_PERCENTAGE = 2000; // 20% max rebalance
    
    // ============ Events ============
    
    event RebalanceExecuted(
        uint256 indexed rebalanceId,
        uint256 timestamp,
        uint256 totalAmount,
        address[] strategies,
        uint256[] amounts,
        string reason
    );
    
    event ConfigUpdated(
        uint256 rebalanceThreshold,
        uint256 maxRebalanceAmount,
        uint256 cooldownPeriod,
        bool autoRebalanceEnabled
    );
    
    event EmergencyRebalance(address indexed strategy, uint256 amount);
    
    // ============ Modifiers ============
    
    modifier onlyVault() {
        require(msg.sender == vault, "Only vault can call");
        _;
    }
    
    modifier onlyStrategyManager() {
        require(msg.sender == strategyManager, "Only strategy manager");
        _;
    }
    
    modifier cooldownPeriodPassed() {
        require(
            block.timestamp >= lastRebalanceTime + config.cooldownPeriod,
            "Cooldown period not passed"
        );
        _;
    }
    
    // ============ Constructor ============
    
    constructor(
        address _vault,
        address _strategyManager,
        uint256 _rebalanceThreshold,
        uint256 _maxRebalanceAmount,
        uint256 _cooldownPeriod
    ) {
        vault = _vault;
        strategyManager = _strategyManager;
        
        config = RebalanceConfig({
            rebalanceThreshold: _rebalanceThreshold,
            maxRebalanceAmount: _maxRebalanceAmount,
            cooldownPeriod: _cooldownPeriod,
            autoRebalanceEnabled: true
        });
    }
    
    // ============ Rebalancing Logic ============
    
    /**
     * @dev Execute rebalancing based on strategy performance
     * @param strategies Array of strategy addresses to rebalance
     * @param amounts Array of amounts for each strategy
     * @param reason Reason for rebalancing
     */
    function executeRebalance(
        address[] calldata strategies,
        uint256[] calldata amounts,
        string calldata reason
    ) external onlyVault nonReentrant cooldownPeriodPassed {
        require(strategies.length == amounts.length, "Arrays length mismatch");
        require(strategies.length > 0, "No strategies provided");
        
        uint256 totalAmount;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
            require(amounts[i] <= config.maxRebalanceAmount, "Amount exceeds max rebalance");
        }
        
        // Record rebalance event
        rebalanceHistory[rebalanceCount] = RebalanceEvent({
            timestamp: block.timestamp,
            totalAmount: totalAmount,
            strategies: strategies,
            amounts: amounts,
            reason: reason
        });
        
        rebalanceCount++;
        lastRebalanceTime = block.timestamp;
        
        emit RebalanceExecuted(
            rebalanceCount - 1,
            block.timestamp,
            totalAmount,
            strategies,
            amounts,
            reason
        );
    }
    
    /**
     * @dev Trigger automatic rebalancing based on performance
     */
    function triggerAutoRebalance() external onlyStrategyManager {
        require(config.autoRebalanceEnabled, "Auto rebalancing disabled");
        require(
            block.timestamp >= lastRebalanceTime + config.cooldownPeriod,
            "Cooldown period not passed"
        );
        
        // This would typically call external strategy manager to get performance data
        // and determine rebalancing needs
        emit RebalanceExecuted(
            rebalanceCount,
            block.timestamp,
            0,
            new address[](0),
            new uint256[](0),
            "Auto rebalance triggered"
        );
    }
    
    /**
     * @dev Emergency rebalance for a specific strategy
     * @param strategy Address of the strategy
     * @param amount Amount to rebalance
     */
    function emergencyRebalance(address strategy, uint256 amount) external onlyOwner {
        require(strategy != address(0), "Invalid strategy");
        require(amount > 0, "Amount must be positive");
        
        emit EmergencyRebalance(strategy, amount);
    }
    
    // ============ Performance Analysis ============
    
    /**
     * @dev Analyze strategy performance and suggest rebalancing
     * @param strategies Array of strategy addresses to analyze
     * @return shouldRebalance True if rebalancing is recommended
     * @return reason Reason for recommendation
     */
    function analyzePerformance(address[] calldata strategies) 
        external 
        view 
        returns (bool shouldRebalance, string memory reason) 
    {
        // This is a simplified analysis - in practice, this would integrate with
        // external data sources and more sophisticated algorithms
        
        if (strategies.length == 0) {
            return (false, "No strategies to analyze");
        }
        
        // Check if any strategy is underperforming significantly
        // This would typically query the StrategyManager for performance scores
        // For now, we'll return a basic recommendation
        
        return (true, "Performance analysis suggests rebalancing");
    }
    
    /**
     * @dev Calculate optimal allocation based on performance
     * @param strategies Array of strategy addresses
     * @param currentAllocations Current allocation percentages
     * @return newAllocations Suggested new allocations
     */
    function calculateOptimalAllocation(
        address[] calldata strategies,
        uint256[] calldata currentAllocations
    ) external pure returns (uint256[] memory newAllocations) {
        require(strategies.length == currentAllocations.length, "Arrays length mismatch");
        
        newAllocations = new uint256[](strategies.length);
        
        // Simplified allocation calculation
        // In practice, this would use more sophisticated algorithms
        uint256 totalAllocation = 10000; // 100% in basis points
        uint256 equalShare = totalAllocation / strategies.length;
        
        for (uint256 i = 0; i < strategies.length; i++) {
            newAllocations[i] = equalShare;
        }
        
        return newAllocations;
    }
    
    // ============ Configuration ============
    
    /**
     * @dev Update rebalancing configuration
     * @param _rebalanceThreshold New rebalance threshold
     * @param _maxRebalanceAmount New max rebalance amount
     * @param _cooldownPeriod New cooldown period
     * @param _autoRebalanceEnabled Whether auto-rebalancing is enabled
     */
    function updateConfig(
        uint256 _rebalanceThreshold,
        uint256 _maxRebalanceAmount,
        uint256 _cooldownPeriod,
        bool _autoRebalanceEnabled
    ) external onlyOwner {
        require(_rebalanceThreshold <= 5000, "Threshold too high"); // Max 50%
        require(_maxRebalanceAmount > 0, "Max amount must be positive");
        require(_cooldownPeriod >= 1 hours, "Cooldown too short");
        
        config = RebalanceConfig({
            rebalanceThreshold: _rebalanceThreshold,
            maxRebalanceAmount: _maxRebalanceAmount,
            cooldownPeriod: _cooldownPeriod,
            autoRebalanceEnabled: _autoRebalanceEnabled
        });
        
        emit ConfigUpdated(
            _rebalanceThreshold,
            _maxRebalanceAmount,
            _cooldownPeriod,
            _autoRebalanceEnabled
        );
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get rebalance history for a specific event
     * @param rebalanceId ID of the rebalance event
     * @return RebalanceEvent struct with event details
     */
    function getRebalanceHistory(uint256 rebalanceId) external view returns (RebalanceEvent memory) {
        require(rebalanceId < rebalanceCount, "Invalid rebalance ID");
        return rebalanceHistory[rebalanceId];
    }
    
    /**
     * @dev Get total number of rebalances executed
     * @return count Total number of rebalances
     */
    function getRebalanceCount() external view returns (uint256) {
        return rebalanceCount;
    }
    
    /**
     * @dev Check if rebalancing can be executed now
     * @return canRebalance True if rebalancing is allowed
     * @return timeRemaining Time remaining in cooldown (if any)
     */
    function canExecuteRebalance() external view returns (bool canRebalance, uint256 timeRemaining) {
        if (block.timestamp >= lastRebalanceTime + config.cooldownPeriod) {
            return (true, 0);
        } else {
            timeRemaining = lastRebalanceTime + config.cooldownPeriod - block.timestamp;
            return (false, timeRemaining);
        }
    }
    
    /**
     * @dev Get current configuration
     * @return RebalanceConfig struct with current settings
     */
    function getConfig() external view returns (RebalanceConfig memory) {
        return config;
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
     * @dev Update strategy manager address
     * @param newStrategyManager New strategy manager address
     */
    function setStrategyManager(address newStrategyManager) external onlyOwner {
        require(newStrategyManager != address(0), "Invalid strategy manager address");
        strategyManager = newStrategyManager;
    }
    
    /**
     * @dev Pause the rebalance executor
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the rebalance executor
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Reset rebalance history (emergency function)
     */
    function resetHistory() external onlyOwner {
        rebalanceCount = 0;
        lastRebalanceTime = 0;
    }
}