// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface IHubReceiver {
    function onSpokeReport(bytes calldata payload) external;
}

interface ISpokeReceiver {
    function receiveInstruction(bytes calldata payload) external;
}

// NOTE: This is a neutral adapter interface.
// For production, swap internals with a concrete messaging provider (e.g., LayerZero/Axelar/CCIP) and
// wire their endpoint callbacks to call hub/spoke receivers below.
contract MessengerAdapter is Ownable, Pausable {
    // chainId => spoke endpoint address on that chain (for addressing purposes)
    mapping(uint256 => bytes) public spokeEndpointByChain; // opaque identifier (provider-specific)

    address public hub; // hub contract on this chain

    event SentTo(uint256 indexed destChainId, bytes payload);
    event SentToHub(bytes payload);
    event HubSet(address indexed hub);
    event SpokeEndpointSet(uint256 indexed chainId, bytes endpoint);

    modifier onlyHub() {
        require(msg.sender == hub, "only hub");
        _;
    }

    function setHub(address _hub) external onlyOwner {
        require(_hub != address(0), "invalid hub");
        hub = _hub;
        emit HubSet(_hub);
    }

    function setSpokeEndpoint(uint256 chainId, bytes calldata endpoint) external onlyOwner {
        spokeEndpointByChain[chainId] = endpoint;
        emit SpokeEndpointSet(chainId, endpoint);
    }

    // Hub -> Spoke send (to be bridged by provider-specific implementation)
    function sendTo(uint256 destChainId, bytes calldata payload) external onlyHub whenNotPaused {
        emit SentTo(destChainId, payload);
        // bridge provider send call goes here
    }

    // Provider callback on destination spoke chain should call this equivalent to deliver to local spoke
    function deliverToSpoke(address spoke, bytes calldata payload) external whenNotPaused onlyOwner {
        ISpokeReceiver(spoke).receiveInstruction(payload);
    }

    // Spoke -> Hub send
    function sendToHub(bytes calldata payload) external whenNotPaused {
        emit SentToHub(payload);
        // bridge provider send call goes here
    }

    // Provider callback on hub chain should call this to deliver to local hub
    function deliverToHub(address _hub, bytes calldata payload) external whenNotPaused onlyOwner {
        IHubReceiver(_hub).onSpokeReport(payload);
    }
}
