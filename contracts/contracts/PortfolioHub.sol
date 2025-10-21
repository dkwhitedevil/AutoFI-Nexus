// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IMessengerAdapter {
    function sendTo(uint256 destChainId, bytes calldata payload) external payable;
}

interface ISpokeVault {
    function receiveInstruction(bytes calldata instruction) external;
}

contract PortfolioHub is Ownable, Pausable, ReentrancyGuard {
    struct TargetWeight {
        address asset;
        uint256 chainId;
        uint256 weightBps;
    }

    struct RebalanceInstruction {
        uint256 nonce;
        uint256 srcChainId;
        uint256 destChainId;
        address asset;
        uint256 amount;
        bytes params;
    }

    struct SpokeReport {
        uint256 chainId;
        address asset;
        uint256 balance;
        uint256 timestamp;
    }

    event TargetsUpdated(uint256 indexed version);
    event InstructionDispatched(uint256 indexed nonce, uint256 indexed destChainId, address asset, uint256 amount);
    event SpokeReported(uint256 indexed chainId, address indexed asset, uint256 balance, uint256 timestamp);

    uint256 public targetsVersion;
    uint256 public instructionNonce;

    IMessengerAdapter public messenger;

    // target weight: asset => chainId => bps
    mapping(address => mapping(uint256 => uint256)) public targetWeights;
    // registered spokes per chain
    mapping(uint256 => address) public spokeByChain;
    // simple accounting: asset => chainId => reported balance
    mapping(address => mapping(uint256 => uint256)) public reportedBalances;

    modifier onlyMessenger() {
        require(msg.sender == address(messenger), "only messenger");
        _;
    }

    constructor(address _messenger) {
        require(_messenger != address(0), "invalid messenger");
        messenger = IMessengerAdapter(_messenger);
    }

    function setMessenger(address _messenger) external onlyOwner {
        require(_messenger != address(0), "invalid messenger");
        messenger = IMessengerAdapter(_messenger);
    }

    function registerSpoke(uint256 chainId, address spoke) external onlyOwner {
        require(spoke != address(0), "invalid spoke");
        spokeByChain[chainId] = spoke;
    }

    function setTargets(TargetWeight[] calldata targets) external onlyOwner whenNotPaused {
        for (uint256 i = 0; i < targets.length; i++) {
            targetWeights[targets[i].asset][targets[i].chainId] = targets[i].weightBps;
        }
        targetsVersion++;
        emit TargetsUpdated(targetsVersion);
    }

    function dispatchInstruction(
        uint256 destChainId,
        address asset,
        uint256 amount,
        bytes calldata params
    ) external onlyOwner whenNotPaused nonReentrant {
        require(spokeByChain[destChainId] != address(0), "unknown spoke");
        instructionNonce++;
        RebalanceInstruction memory instr = RebalanceInstruction({
            nonce: instructionNonce,
            srcChainId: block.chainid,
            destChainId: destChainId,
            asset: asset,
            amount: amount,
            params: params
        });
        bytes memory payload = abi.encode(instr);
        messenger.sendTo(destChainId, payload);
        emit InstructionDispatched(instructionNonce, destChainId, asset, amount);
    }

    function onSpokeReport(bytes calldata payload) external onlyMessenger {
        SpokeReport memory r = abi.decode(payload, (SpokeReport));
        reportedBalances[r.asset][r.chainId] = r.balance;
        emit SpokeReported(r.chainId, r.asset, r.balance, r.timestamp);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
