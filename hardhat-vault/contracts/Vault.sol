// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AutoFi Nexus Vault
 * @dev A simple vault contract for depositing and withdrawing ETH
 * Features: Deposits, Withdrawals, Balance tracking, Event emissions
 */
contract Vault {
    // Mapping to track user balances
    mapping(address => uint256) public balances;
    
    // Total ETH stored in the vault
    uint256 public totalDeposits;
    
    // Events for tracking transactions
    event Deposit(address indexed user, uint256 amount, uint256 timestamp);
    event Withdraw(address indexed user, uint256 amount, uint256 timestamp);
    
    /**
     * @dev Deposit ETH to the Vault
     * Emits a Deposit event
     */
    function deposit() external payable {
        require(msg.value > 0, "Must deposit ETH");
        
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }
    
    /**
     * @dev Withdraw ETH from the Vault
     * @param amount Amount of ETH to withdraw (in wei)
     * Emits a Withdraw event
     */
    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        totalDeposits -= amount;
        
        // Transfer ETH to user
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdraw(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Get user balance in the vault
     * @param user Address of the user
     * @return User's balance in wei
     */
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }
    
    /**
     * @dev Get total contract balance
     * @return Total ETH in the contract
     */
    function getTotalBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Emergency withdraw all funds (only for owner - simplified version)
     * In production, you'd want proper access control
     */
    function emergencyWithdraw() external {
        uint256 userBalance = balances[msg.sender];
        require(userBalance > 0, "No balance to withdraw");
        
        balances[msg.sender] = 0;
        totalDeposits -= userBalance;
        
        (bool success, ) = payable(msg.sender).call{value: userBalance}("");
        require(success, "Transfer failed");
        
        emit Withdraw(msg.sender, userBalance, block.timestamp);
    }
}
