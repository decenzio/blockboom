// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/**
 * BlockBoom - Song of the Day Game Contract
 * A decentralized music voting game where users can add songs and vote with ETH
 */
contract BlockBoom {
    address public immutable owner;

    bool public gameExists = false;
    bool public gameActive = false;
    uint256 public constant MAX_SONGS = 2;
    uint256 public constant VOTE_THRESHOLD = 2;
    uint256 public constant MIN_BET_AMOUNT = 0.001 ether;

    struct Song {
        string title;
        string author;
        string url;
        address addedBy;
        uint256 votes;
    }

    Song[] public songs;
    uint256 public songCount = 0;

    struct Vote {
        address voter;
        uint256[] songRankings;
        uint256 betAmount;
        bool hasVoted;
    }

    mapping(address => Vote) public votes;
    address[] public voters;
    uint256 public totalVotes = 0;
    uint256 public totalPrizePool = 0;

    event GameCreated(address indexed creator);
    event SongAdded(address indexed adder, string title, string author, string url, uint256 songIndex);
    event VoteCast(address indexed voter, uint256[] rankings, uint256 betAmount);
    event GameEnded(address indexed winner, uint256 prizeAmount);
    event PrizeDistributed(address indexed winner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier gameMustExist() {
        require(gameExists, "Game does not exist");
        _;
    }

    modifier gameMustBeActive() {
        require(gameActive, "Game is not active");
        _;
    }

    modifier hasNotVoted() {
        require(!votes[msg.sender].hasVoted, "Already voted");
        _;
    }

    modifier validSongCount() {
        require(songCount < MAX_SONGS, "Song list is full");
        _;
    }

    constructor(address _owner) {
        owner = _owner;
    }

    function createGame() external {
        require(!gameExists, "Game already exists");

        gameExists = true;
        gameActive = true;
        songCount = 0;
        totalVotes = 0;
        totalPrizePool = 0;

        delete songs;
        for (uint256 i = 0; i < voters.length; i++) {
            delete votes[voters[i]];
        }
        delete voters;

        emit GameCreated(msg.sender);
    }

    function addSong(string memory _title, string memory _author, string memory _url)
        external
        gameMustExist
        gameMustBeActive
        validSongCount
    {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_author).length > 0, "Author cannot be empty");
        require(bytes(_url).length > 0, "URL cannot be empty");

        songs.push(Song({ title: _title, author: _author, url: _url, addedBy: msg.sender, votes: 0 }));
        songCount++;

        emit SongAdded(msg.sender, _title, _author, _url, songCount - 1);
    }

    function vote(uint256[] memory _songRankings)
        external
        payable
        gameMustExist
        gameMustBeActive
        hasNotVoted
    {
        require(msg.value >= MIN_BET_AMOUNT, "Bet amount too low");
        require(_songRankings.length == songCount, "Invalid ranking length");
        require(songCount == MAX_SONGS, "Song list not full yet");
        require(_isValidRanking(_songRankings), "Invalid song rankings");

        votes[msg.sender] = Vote({ voter: msg.sender, songRankings: _songRankings, betAmount: msg.value, hasVoted: true });

        voters.push(msg.sender);
        totalVotes++;
        totalPrizePool += msg.value;

        emit VoteCast(msg.sender, _songRankings, msg.value);

        if (totalVotes >= VOTE_THRESHOLD) {
            _endGame();
        }
    }

    function _endGame() internal {
        gameActive = false;

        for (uint256 i = 0; i < voters.length; i++) {
            address voter = voters[i];
            Vote memory voterVote = votes[voter];
            for (uint256 j = 0; j < voterVote.songRankings.length; j++) {
                uint256 songIndex = voterVote.songRankings[j];
                uint256 points = songCount - j;
                songs[songIndex].votes += points;
            }
        }

        uint256 winningSongIndex = 0;
        uint256 maxVotes = songs[0].votes;
        for (uint256 i = 1; i < songs.length; i++) {
            if (songs[i].votes > maxVotes) {
                maxVotes = songs[i].votes;
                winningSongIndex = i;
            }
        }

        address winner = songs[winningSongIndex].addedBy;
        emit GameEnded(winner, totalPrizePool);

        if (totalPrizePool > 0) {
            (bool success, ) = winner.call{ value: totalPrizePool }("");
            require(success, "Failed to send prize");
            emit PrizeDistributed(winner, totalPrizePool);
        }
    }

    function _isValidRanking(uint256[] memory _rankings) internal view returns (bool) {
        if (_rankings.length != songCount) return false;
        bool[] memory used = new bool[](songCount);
        for (uint256 i = 0; i < _rankings.length; i++) {
            uint256 songIndex = _rankings[i];
            if (songIndex >= songCount || used[songIndex]) {
                return false;
            }
            used[songIndex] = true;
        }
        return true;
    }

    function getAllSongs() external view returns (Song[] memory) {
        return songs;
    }

    function getGameStatus()
        external
        view
        returns (bool _gameExists, bool _gameActive, uint256 _songCount, uint256 _totalVotes, uint256 _prizePool)
    {
        return (gameExists, gameActive, songCount, totalVotes, totalPrizePool);
    }

    function getUserVote(address _user) external view returns (Vote memory) {
        return votes[_user];
    }

    function emergencyEndGame() external onlyOwner {
        gameActive = false;
    }

    function withdraw() external onlyOwner {
        (bool success, ) = owner.call{ value: address(this).balance }("");
        require(success, "Failed to send Ether");
    }

    receive() external payable {}
}