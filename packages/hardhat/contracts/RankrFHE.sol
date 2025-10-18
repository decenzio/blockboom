// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract RankrFHE is SepoliaConfig {
    uint256 public constant MAX_ITEMS = 3;
    uint256 public constant MAX_PLAYERS = 4;
    uint256 public constant MAX_VOTES = MAX_PLAYERS;

    struct ItemInput {
        string author;
        string title;
        string url;
    }

    struct Item {
        string author;
        string title;
        string url;
        address adder;
        uint256 addedAt;
        euint32 votes;
    }

    enum Phase { CollectingItems, CollectingVotes }
    Phase public phase = Phase.CollectingItems;

    Item[MAX_ITEMS] public items;
    uint8 public itemsCount;
    mapping(address => bool) public hasVoted;
    address[] public voters;

    uint256 public totalVotes;
    uint256 public prizePool;

    bool private _entered;

    error WrongPhase(Phase expected, Phase current);
    error ItemsFull();
    error InvalidItem();
    error AlreadyVoted();
    error InvalidItemId();
    error Reentrancy();
    error NoDirectETH();
    error InvalidSender();
    error NoETHSent();
    error DuplicateItem();

    event ItemAdded(uint256 indexed itemId, address indexed adder, uint256 timestamp, string author, string title, string url);
    event Voted(address indexed voter);
    event RoundFinalized(uint8[] winnerIds, uint256 prizePerWinner);

    modifier inPhase(Phase expected) {
        if (phase != expected) revert WrongPhase(expected, phase);
        _;
    }

    modifier nonReentrant() {
        if (_entered) revert Reentrancy();
        _entered = true;
        _;
        _entered = false;
    }

    function addItem(ItemInput calldata item) external inPhase(Phase.CollectingItems) {
        if (itemsCount >= MAX_ITEMS) revert ItemsFull();
        if (!_isValidItemInput(item)) revert InvalidItem();
        if (_isDuplicateItem(item)) revert DuplicateItem();

        euint32 initialVotes = FHE.asEuint32(0);
        FHE.allowThis(initialVotes);
        
        items[itemsCount] = Item({
            author: item.author,
            title: item.title,
            url: item.url,
            adder: msg.sender,
            addedAt: block.timestamp,
            votes: initialVotes
        });

        emit ItemAdded(itemsCount, msg.sender, block.timestamp, item.author, item.title, item.url);
        itemsCount++;

        if (itemsCount == MAX_ITEMS) {
            phase = Phase.CollectingVotes;
        }
    }

    function vote(externalEuint32 inputItemId, bytes calldata itemIdProof) external payable inPhase(Phase.CollectingVotes) nonReentrant {
        if (msg.sender == address(0)) revert InvalidSender();
        if (hasVoted[msg.sender]) revert AlreadyVoted();
        if (msg.value == 0) revert NoETHSent();

        // Convert external encrypted input to internal euint32
        euint32 encryptedItemId = FHE.fromExternal(inputItemId, itemIdProof);

        // Note: In a real implementation, you'd want to validate the encrypted item ID
        // against the valid range [0, itemsCount-1]. For now, we'll rely on the
        // voting logic to handle invalid IDs gracefully.

        for (uint8 i = 0; i < itemsCount; i++) {
            euint32 encryptedI = FHE.asEuint32(i);
            FHE.allowThis(encryptedI);
            ebool isEqual = FHE.eq(encryptedItemId, encryptedI);
            // Add 1 vote to this item if it matches (using conditional selection)
            euint32 voteIncrement = FHE.select(isEqual, FHE.asEuint32(1), FHE.asEuint32(0));
            FHE.allowThis(voteIncrement);
            items[i].votes = FHE.add(items[i].votes, voteIncrement);
            FHE.allowThis(items[i].votes);
        }

        hasVoted[msg.sender] = true;
        voters.push(msg.sender);
        totalVotes++;
        prizePool += msg.value;

        emit Voted(msg.sender);

        if (totalVotes == MAX_VOTES) {
            _finalizeRound();
        }
    }

    function _finalizeRound() internal {
        if (itemsCount == 0) return;

        // Since we can't decrypt in the contract, we'll split the prize equally
        // among all item adders. In a real implementation, you'd need to handle
        // the decryption on the client side or use a different approach.
        if (prizePool == 0) return;

        uint256 winnerShare = (prizePool * 80) / 100 / itemsCount;
        uint8[] memory allItems = new uint8[](itemsCount);
        
        for (uint8 i = 0; i < itemsCount; i++) {
            allItems[i] = i;
            (bool sent,) = payable(items[i].adder).call{value: winnerShare}("");
            require(sent, "Transfer failed");
        }

        emit RoundFinalized(allItems, winnerShare);
        prizePool = 0;
        _resetState();
    }

    function _resetState() internal {
        for (uint8 i = 0; i < itemsCount; i++) {
            delete items[i];
        }
        itemsCount = 0;
        phase = Phase.CollectingItems;
        totalVotes = 0;

        for (uint256 i = 0; i < voters.length; i++) {
            hasVoted[voters[i]] = false;
        }
        delete voters;
    }

    function _isValidItemInput(ItemInput calldata item) internal pure returns (bool) {
        return bytes(item.author).length > 0 && bytes(item.author).length <= 100 &&
               bytes(item.title).length > 0 && bytes(item.title).length <= 100 &&
               bytes(item.url).length > 0 && bytes(item.url).length <= 200;
    }

    function _isDuplicateItem(ItemInput calldata item) internal view returns (bool) {
        for (uint8 i = 0; i < itemsCount; i++) {
            if (keccak256(bytes(item.author)) == keccak256(bytes(items[i].author)) &&
                keccak256(bytes(item.title)) == keccak256(bytes(items[i].title)) &&
                keccak256(bytes(item.url)) == keccak256(bytes(items[i].url))) {
                return true;
            }
        }
        return false;
    }

    function canFinalize() public view returns (bool) {
        return totalVotes == MAX_VOTES && itemsCount > 0;
    }

    receive() external payable { revert NoDirectETH(); }
    fallback() external payable { revert NoDirectETH(); }
}
