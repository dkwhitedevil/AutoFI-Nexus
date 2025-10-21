// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockAave
 * @dev Mock Aave lending protocol for testing purposes
 */
contract MockAave is ERC20 {
    IERC20 public underlyingAsset;
    uint256 public liquidityRate; // Annual interest rate (in basis points)
    
    mapping(address => uint256) public userSupplies;
    uint256 public totalSupply_underlying;
    
    event Supply(address indexed user, uint256 amount, uint256 supplyBalance);
    event Withdraw(address indexed user, uint256 amount, uint256 supplyBalance);
    
    constructor(address _underlyingAsset, string memory name, string memory symbol) ERC20(name, symbol) {
        underlyingAsset = IERC20(_underlyingAsset);
        liquidityRate = 500; // 5% APY default
    }
    
    /**
     * @dev Supply assets to the protocol
     * @param amount Amount to supply
     */
    function supply(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        
        // Transfer underlying asset from user
        require(underlyingAsset.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Mint aTokens to user (1:1 ratio for simplicity)
        _mint(msg.sender, amount);
        
        // Update user supply tracking
        userSupplies[msg.sender] += amount;
        totalSupply_underlying += amount;
        
        emit Supply(msg.sender, amount, userSupplies[msg.sender]);
    }
    
    /**
     * @dev Withdraw assets from the protocol
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(userSupplies[msg.sender] >= amount, "Insufficient supply");
        
        // Burn aTokens from user
        _burn(msg.sender, amount);
        
        // Update user supply tracking
        userSupplies[msg.sender] -= amount;
        totalSupply_underlying -= amount;
        
        // Transfer underlying asset to user
        require(underlyingAsset.transfer(msg.sender, amount), "Transfer failed");
        
        emit Withdraw(msg.sender, amount, userSupplies[msg.sender]);
    }
    
    /**
     * @dev Set the liquidity rate (APY)
     * @param newRate New liquidity rate in basis points
     */
    function setLiquidityRate(uint256 newRate) external {
        liquidityRate = newRate;
    }
    
    /**
     * @dev Get the current APY
     * @return Current APY in basis points
     */
    function getLiquidityRate() external view returns (uint256) {
        return liquidityRate;
    }
    
    /**
     * @dev Get user's supply balance
     * @param user User address
     * @return Supply balance
     */
    function getSupplyBalance(address user) external view returns (uint256) {
        return userSupplies[user];
    }
    
    /**
     * @dev Get total supply of underlying asset
     * @return Total supply
     */
    function getTotalSupply() external view returns (uint256) {
        return totalSupply_underlying;
    }
}