// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/**
 * @title Rank5 Autonomous Game
 * @notice 5 items, 10 players. Each ranking costs 0.001 ETH.
 *         When 10th player submits, contract:
 *           1) Calculates cumulative ranking (Borda count)
 *           2) Finds player(s) closest to final order
 *           3) Splits and pays prize pool
 *           4) Resets for next round
 */
contract Rank5Game {
    uint256 public constant ENTRY_FEE = 1e15; // 0.001 ETH
    uint8   public constant NUM_ITEMS = 5;
    uint8   public constant MAX_PLAYERS = 10;

    enum Phase { CollectingItems, CollectingRanks }
    Phase public phase = Phase.CollectingItems;

    struct Item {
        string author;
        string title;
        string url;
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
    mapping(address => bool) public hasRanked;

    uint256 public prizePool;

    event ItemAdded(uint8 indexed index, string author, string title, string url);
    event RankingSubmitted(address indexed player, uint8[NUM_ITEMS] order);
    event RoundCompleted(address[] winners, uint256 rewardPerWinner);
    event RoundReset();

    // --------- External ---------

    /// @notice Add an item with author, title and url until NUM_ITEMS exist, then switch to ranking phase
    function addItem(ItemInput calldata item) external {
        require(phase == Phase.CollectingItems, "not item phase");
        require(itemsCount < NUM_ITEMS, "items full");
        require(_isValidItemInput(item), "invalid item");

        items[itemsCount] = Item({ author: item.author, title: item.title, url: item.url });
        emit ItemAdded(itemsCount, item.author, item.title, item.url);
        itemsCount++;

        if (itemsCount == NUM_ITEMS) phase = Phase.CollectingRanks;
    }

    /// @notice Submit ranking (best→worst), costs 0.001 ETH
    function rankItems(uint8[NUM_ITEMS] calldata order) external payable {
        require(phase == Phase.CollectingRanks, "not ranking phase");
        require(msg.value == ENTRY_FEE, "need 0.001 ETH");
        require(!hasRanked[msg.sender], "already ranked");
        _validatePermutation(order);

        players.push(msg.sender);
        hasRanked[msg.sender] = true;
        rankings[msg.sender] = order;
        prizePool += msg.value;

        emit RankingSubmitted(msg.sender, order);

        if (players.length == MAX_PLAYERS) {
            _finalizeRound();
        }
    }

    // --------- View helpers ---------

    function getCurrentItems() external view returns (Item[NUM_ITEMS] memory) {
        return items;
    }

    function getPlayers() external view returns (address[] memory) {
        return players;
    }

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
            require(ok, "payout failed");
        }

        emit RoundCompleted(winners, reward);

        // --- 5. Reset state for next round ---
        _resetState();
    }

    function _resetState() internal {
        for (uint8 i = 0; i < NUM_ITEMS; i++) {
            items[i] = Item({ author: "", title: "", url: "" });
        }
        itemsCount = 0;

        for (uint8 i = 0; i < players.length; i++) {
            delete hasRanked[players[i]];
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
            require(v < NUM_ITEMS, "index out of range");
            require(!seen[v], "duplicate");
            seen[v] = true;
        }
    }

    receive() external payable { revert("no direct ETH"); }
}