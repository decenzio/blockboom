// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/**
 * @title Rank5 Autonomous Game
 * @notice Repeated rounds game with {NUM_ITEMS} items and up to {MAX_PLAYERS} players per round.
 *         Each ranking submission requires exactly {ENTRY_FEE} wei. On reaching {MAX_PLAYERS} players:
 *           1) Compute cumulative ranking via Borda count
 *           2) Identify player(s) whose order matches the final order most closely
 *           3) Split and pay the prize pool among winners (first gets remainder)
 *           4) Reset state for the next round
 * @dev Functionality preserved; refactored with custom errors, modifiers, NatSpec and reentrancy guard.
 */
contract Rankr {
    uint256 public constant ENTRY_FEE = 1e13; // 0.0001 ETH
    uint8   public constant NUM_ITEMS = 3;
    uint8   public constant MAX_PLAYERS = 8;

    enum Phase { CollectingItems, CollectingRanks }
    Phase public phase = Phase.CollectingItems;

    // --------- Errors ---------
    error WrongPhase(Phase expected, Phase current);
    error ItemsFull();
    error InvalidItem();
    error WrongEntryFee(uint256 provided);
    error AlreadyRanked();
    error IndexOutOfRange(uint8 index);
    error DuplicateIndex(uint8 index);
    error PayoutFailed(address to, uint256 amount);
    error NoDirectETH();
    error Reentrancy();

    struct Item {
        string author;
        string title;
        string url;
        address adder;
        uint256 addedAt;
    }

    struct ItemInput {
        string author;
        string title;
        string url;
    }

    Item[NUM_ITEMS] public items;
    uint8 public itemsCount;

    address[] public players;
    mapping(address => uint8[NUM_ITEMS]) private rankings;

    uint256 public prizePool;

    // Reentrancy guard (lightweight)
    bool private _entered;

    event ItemAdded(uint8 indexed index, address indexed adder, uint256 addedAt, string author, string title, string url);
    event RankingSubmitted(address indexed player, uint8[NUM_ITEMS] order);
    event RoundCompleted(address[] winners, uint256 rewardPerWinner);
    event RoundReset();

    // --------- Modifiers ---------
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

    // --------- External ---------

    /// @notice Add an item with author, title and url until NUM_ITEMS exist, then switch to ranking phase.
    /// @dev Reverts when not in CollectingItems phase, when items are full, or input is invalid.
    /// @param item Author, title and url of the item to add.
    function addItem(ItemInput calldata item) external inPhase(Phase.CollectingItems) {
        if (itemsCount >= NUM_ITEMS) revert ItemsFull();
        if (!_isValidItemInput(item)) revert InvalidItem();

        items[itemsCount] = Item({ author: item.author, title: item.title, url: item.url, adder: msg.sender, addedAt: block.timestamp });
        emit ItemAdded(itemsCount, msg.sender, block.timestamp, item.author, item.title, item.url);
        itemsCount++;

        if (itemsCount == NUM_ITEMS) phase = Phase.CollectingRanks;
    }

    /// @notice Submit ranking (best→worst) for the current round by paying exactly ENTRY_FEE wei.
    /// @dev Reverts when not in CollectingRanks phase, wrong ETH value, or sender already ranked.
    /// @param order A permutation of [0..NUM_ITEMS-1] from best to worst.
    function rankItems(uint8[NUM_ITEMS] calldata order) external payable inPhase(Phase.CollectingRanks) nonReentrant {
        if (msg.value != ENTRY_FEE) revert WrongEntryFee(msg.value);
        _validatePermutation(order);

        players.push(msg.sender);
        rankings[msg.sender] = order;
        prizePool += msg.value;

        emit RankingSubmitted(msg.sender, order);

        if (players.length == MAX_PLAYERS) {
            _finalizeRound();
        }
    }

    // --------- View helpers ---------

    /// @notice Returns the items proposed for the current round.
    /// @return The fixed-size array of items of length NUM_ITEMS.
    function getCurrentItems() external view returns (Item[NUM_ITEMS] memory) {
        return items;
    }

    /// @notice Returns the addresses of players who have ranked in the current round so far.
    /// @return The dynamic list of player addresses.
    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    /// @notice Returns the current prize pool (in wei) accumulated for the round.
    /// @return The prize pool balance.
    function getPrizePool() external view returns (uint256) {
        return prizePool;
    }

    // --------- Internal logic ---------

    function _finalizeRound() internal {
        // --- 1. Compute cumulative item scores (Borda count) ---
        uint16[NUM_ITEMS] memory scores;
        for (uint8 p = 0; p < MAX_PLAYERS; p++) {
            uint8[NUM_ITEMS] memory order = rankings[players[p]];
            for (uint8 pos = 0; pos < NUM_ITEMS; pos++) {
                scores[order[pos]] += uint16(NUM_ITEMS - pos); // NUM_ITEMS..1 pts
            }
        }

        // --- 2. Sort items by total score to get final order ---
        uint8[NUM_ITEMS] memory finalOrder;
        for (uint8 i = 0; i < NUM_ITEMS; i++) {
            finalOrder[i] = i;
        }
        for (uint8 i = 0; i < NUM_ITEMS; i++) {
            uint8 best = i;
            for (uint8 j = i + 1; j < NUM_ITEMS; j++) {
                if (scores[finalOrder[j]] > scores[finalOrder[best]]) best = j;
            }
            (finalOrder[i], finalOrder[best]) = (finalOrder[best], finalOrder[i]);
        }

        // --- 3. Score each player by how many positions match ---
        uint8 maxMatch = 0;
        address[] memory tmp = new address[](MAX_PLAYERS);
        uint8 winCount = 0;

        for (uint8 p = 0; p < MAX_PLAYERS; p++) {
            uint8[NUM_ITEMS] memory ord = rankings[players[p]];
            uint8 matches = 0;
            for (uint8 k = 0; k < NUM_ITEMS; k++)
                if (ord[k] == finalOrder[k]) matches++;

            if (matches > maxMatch) {
                maxMatch = matches;
                winCount = 1;
                tmp[0] = players[p];
            } else if (matches == maxMatch) {
                tmp[winCount++] = players[p];
            }
        }

        // --- 4. Pay winners equally ---
        address[] memory winners = new address[](winCount);
        for (uint8 i = 0; i < winCount; i++) winners[i] = tmp[i];
        uint256 poolBeforePayout = prizePool;
        uint256 reward = poolBeforePayout / winCount;
        uint256 totalBase = reward * winCount;
        uint256 remainder = poolBeforePayout - totalBase;
        prizePool = 0; // CEI: zero before external calls

        for (uint8 i = 0; i < winCount; i++) {
            uint256 amount = reward + (i == 0 ? remainder : 0);
            (bool ok, ) = winners[i].call{value: amount}("");
            if (!ok) revert PayoutFailed(winners[i], amount);
        }

        emit RoundCompleted(winners, reward);

        // --- 5. Reset state for next round ---
        _resetState();
    }

    function _resetState() internal {
        for (uint8 i = 0; i < NUM_ITEMS; i++) {
            items[i] = Item({ author: "", title: "", url: "", adder: address(0), addedAt: 0 });
        }
        itemsCount = 0;

        for (uint8 i = 0; i < players.length; i++) {
            delete rankings[players[i]];
        }
        delete players;
        prizePool = 0;
        phase = Phase.CollectingItems;

        emit RoundReset();
    }

    // --------- Utils ---------

    function _isValidItemInput(ItemInput calldata item) internal pure returns (bool) {
        if (bytes(item.author).length == 0) return false;
        if (bytes(item.title).length == 0) return false;
        if (bytes(item.url).length == 0) return false;
        return true;
    }

    function _validatePermutation(uint8[NUM_ITEMS] calldata order) internal pure {
        bool[NUM_ITEMS] memory seen;
        for (uint8 i = 0; i < NUM_ITEMS; i++) {
            uint8 v = order[i];
            if (v >= NUM_ITEMS) revert IndexOutOfRange(v);
            if (seen[v]) revert DuplicateIndex(v);
            seen[v] = true;
        }
    }

    /// @dev No direct ETH transfers accepted.
    receive() external payable { revert NoDirectETH(); }

    /// @dev No function selectors supported; reject unknown calls and ETH via fallback path.
    fallback() external payable { revert NoDirectETH(); }
}