pragma solidity ^0.8.20;

/// @title  AutoFiCore - Intent Receiver & Executor (MVP)
/// @notice Minimal, audit-friendly core for storing user intents and allowing authorized agents to execute them.
/// @dev    Integrates with Avail intents / Vincent agents / Envio indexing / Blockscout verification.

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AutoFiCore is Ownable, AccessControl, ReentrancyGuard {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    uint256 public nextIntentId;

    /// @notice constructor grants deployer default admin and agent role
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AGENT_ROLE, msg.sender);
        nextIntentId = 1; // first intent starts at 1
    }
    
    struct Intent {
        address user;         // user who submitted the intent
        uint256 chainId;      // intended target chain (for bookkeeping / multi-chain)
        address target;       // contract to call when executing intent
        uint256 value;        // ETH value to send with call
        bytes data;           // encoded calldata (ABI encoded)
        uint64 validAfter;    // unix timestamp after which intent can be executed
        uint64 validUntil;    // unix timestamp after which intent expires (0 = no expiry)
        bool executed;
        bool canceled;
    }

    /// @dev intents mapping by id
    mapping(uint256 => Intent) public intents;

    /// @dev events for indexing and UI
    event IntentSubmitted(
        uint256 indexed intentId,
        address indexed user,
        address indexed target,
        uint256 value,
        uint256 chainId,
        uint64 validAfter,
        uint64 validUntil
    );
    
    event IntentExecuted(
        uint256 indexed intentId,
        address indexed executor,
        address indexed target,
        uint256 value,
        bytes returnData
    );

    event IntentExecutionFailed(
        uint256 indexed intentId,
        address indexed executor,
        string reason
    );

    event IntentCanceled(uint256 indexed intentId, address indexed user);

    /* ============ MODIFIERS ============ */

    modifier onlyValidIntent(uint256 _id) {
        require( _id > 0 && _id < nextIntentId, "Invalid intent id");
        _;
    }

    /* ============ CORE FUNCTIONS ============ */

    /// @notice Submit an intent (store desired action)
    function submitIntent(
        uint256 _chainId,
        address _target,
        uint256 _value,
        bytes calldata _data,
        uint64 _validAfter,
        uint64 _validUntil
    ) external returns (uint256 intentId) {
        require(_target != address(0), "Invalid target");
        require(_validUntil == 0 || _validUntil > _validAfter, "Invalid time window");

        intentId = nextIntentId++;
        intents[intentId] = Intent({
            user: msg.sender,
            chainId: _chainId,
            target: _target,
            value: _value,
            data: _data,
            validAfter: _validAfter,
            validUntil: _validUntil,
            executed: false,
            canceled: false
        });

        emit IntentSubmitted(intentId, msg.sender, _target, _value, _chainId, _validAfter, _validUntil);
        return intentId;
    }

    /// @notice Execute an intent. Only AGENT_ROLE or owner can call.
    function executeIntent(uint256 _id)
        external
        nonReentrant
        onlyValidIntent(_id)
        returns (bool success, bytes memory returnData)
    {
        Intent storage intent = intents[_id];
        require(!intent.executed, "Intent already executed");
        require(!intent.canceled, "Intent canceled");

        uint64 now64 = uint64(block.timestamp);
        require(now64 >= intent.validAfter, "Too early");
        if (intent.validUntil != 0) {
            require(now64 <= intent.validUntil, "Intent expired");
        }

        require(hasRole(AGENT_ROLE, msg.sender) || owner() == msg.sender, "Not authorized");

        intent.executed = true; // mark before external call to avoid reentrancy

        // Perform the call
        (success, returnData) = _safeExternalCall(intent.target, intent.value, intent.data);

        if (success) {
            emit IntentExecuted(_id, msg.sender, intent.target, intent.value, returnData);
        } else {
            string memory reason = _parseRevertReason(returnData);
            emit IntentExecutionFailed(_id, msg.sender, reason);
        }

        return (success, returnData);
    }

    /// @notice Cancel an intent. Only the owner or original user.
    function cancelIntent(uint256 _id) external onlyValidIntent(_id) {
        Intent storage intent = intents[_id];
        require(msg.sender == intent.user || owner() == msg.sender, "Not allowed to cancel");
        require(!intent.executed, "Already executed");
        require(!intent.canceled, "Already canceled");

        intent.canceled = true;
        emit IntentCanceled(_id, intent.user);
    }

    mapping(address => uint256) public balances;

    function deposit() external payable {
        require(msg.value > 0, "No ETH sent");
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }

    /* ============ ADMIN / ROLES ============ */

    function addAgent(address _agent) external onlyOwner {
        _grantRole(AGENT_ROLE, _agent);
    }

    function removeAgent(address _agent) external onlyOwner {
        _revokeRole(AGENT_ROLE, _agent);
    }

    /* ============ HELPERS ============ */

    function _safeExternalCall(address to, uint256 value, bytes memory data)
    internal
    returns (bool, bytes memory)
    {
        (bool ok, bytes memory ret) = to.call{value: value}(data);
        return (ok, ret);
    }

    receive() external payable {}
    
/// @dev Best-effort parse revert reason
function _parseRevertReason(bytes memory _returnData) internal view returns (string memory) {
    if (_returnData.length < 4) return "Execution reverted";
    bytes memory sliced = new bytes(_returnData.length - 4);
    for (uint256 i = 4; i < _returnData.length; i++) {
        sliced[i - 4] = _returnData[i];
    }
    try this._decodeString(sliced) returns (string memory reason) {
        return reason;
    } catch {
        return "Execution reverted (unknown reason)";
    }
}

function _decodeString(bytes memory b) external pure returns (string memory) {
    return abi.decode(b, (string));
}
}