// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ISpokeMessengerAdapter {
    function sendToHub(bytes calldata payload) external payable;
}

contract SpokeVault is Ownable, Pausable, ReentrancyGuard {
    struct RebalanceInstruction {
        uint256 nonce;
        uint256 srcChainId;
        uint256 destChainId;
        address asset;
        uint256 amount;
        bytes params; // e.g., DEX route, minOut
    }

    struct SpokeReport {
        uint256 chainId;
        address asset;
        uint256 balance;
        uint256 timestamp;
    }

    event InstructionReceived(uint256 indexed nonce, address indexed asset, uint256 amount);
    event Executed(uint256 indexed nonce, bool success, uint256 amountOut);

    address public immutable asset; // optional: set to 0 for multi-asset later
    address public hub; // hub address on remote chain for auth reference
    ISpokeMessengerAdapter public messenger;

    modifier onlyMessenger() {
        require(msg.sender == address(messenger), "only messenger");
        _;
    }

    constructor(address _asset, address _messenger, address _hub) {
        asset = _asset;
        messenger = ISpokeMessengerAdapter(_messenger);
        hub = _hub;
    }

    function setMessenger(address _messenger) external onlyOwner {
        require(_messenger != address(0), "invalid messenger");
        messenger = ISpokeMessengerAdapter(_messenger);
    }

    function setHub(address _hub) external onlyOwner {
        require(_hub != address(0), "invalid hub");
        hub = _hub;
    }

    // Cross-chain entrypoint from messenger
    function receiveInstruction(bytes calldata payload) external onlyMessenger whenNotPaused nonReentrant {
        RebalanceInstruction memory instr = abi.decode(payload, (RebalanceInstruction));
        emit InstructionReceived(instr.nonce, instr.asset, instr.amount);
        // TODO: decode params and execute local DEX/bridge. For now, no-op.
        _report();
        emit Executed(instr.nonce, true, 0);
    }

    function _report() internal {
        uint256 bal = 0;
        if (asset != address(0)) {
            bal = IERC20(asset).balanceOf(address(this));
        }
        SpokeReport memory r = SpokeReport({
            chainId: block.chainid,
            asset: asset,
            balance: bal,
            timestamp: block.timestamp
        });
        messenger.sendToHub(abi.encode(r));
    }

    function sweep(address token, address to, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(to, amount), "sweep failed");
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
