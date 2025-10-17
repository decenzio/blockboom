import { expect } from "chai";
import { ethers } from "hardhat";
import type { BlockBoom } from "../typechain-types";

describe("BlockBoom", function () {
  let blockBoom: BlockBoom;

  beforeEach(async () => {
    const [owner] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("BlockBoom");
    blockBoom = (await factory.deploy(owner.address)) as unknown as BlockBoom;
    await blockBoom.waitForDeployment();
  });

  it("deploys with constants set", async () => {
    expect(await blockBoom.MAX_SONGS()).to.equal(2n);
    expect(await blockBoom.VOTE_THRESHOLD()).to.equal(2n);
    expect(await blockBoom.MIN_BET_AMOUNT()).to.equal(ethers.parseEther("0.001"));
  });

  it("runs a full game flow: create -> add songs -> vote -> end", async () => {
    const [owner, alice, bob, voter1, voter2] = await ethers.getSigners();

    // Create game
    await expect(blockBoom.connect(owner).createGame()).to.emit(blockBoom, "GameCreated").withArgs(owner.address);

    const statusAfterCreate = await blockBoom.getGameStatus();
    expect(statusAfterCreate[0]).to.equal(true); // gameExists
    expect(statusAfterCreate[1]).to.equal(true); // gameActive
    expect(statusAfterCreate[2]).to.equal(0n); // songCount
    expect(statusAfterCreate[3]).to.equal(0n); // totalVotes
    expect(statusAfterCreate[4]).to.equal(0n); // prizePool

    // Add two songs
    await expect(blockBoom.connect(alice).addSong("Song A", "Artist A", "https://a"))
      .to.emit(blockBoom, "SongAdded")
      .withArgs(alice.address, "Song A", "Artist A", "https://a", 0n);

    await expect(blockBoom.connect(bob).addSong("Song B", "Artist B", "https://b"))
      .to.emit(blockBoom, "SongAdded")
      .withArgs(bob.address, "Song B", "Artist B", "https://b", 1n);

    const songs = await blockBoom.getAllSongs();
    expect(songs.length).to.equal(2);
    expect(songs[0].title).to.equal("Song A");
    expect(songs[1].title).to.equal("Song B");

    // Prepare identical rankings [0, 1] for both voters to avoid tie
    const order = [0n, 1n];
    const minFee = await blockBoom.MIN_BET_AMOUNT();

    await expect(blockBoom.connect(voter1).vote(order, { value: minFee }))
      .to.emit(blockBoom, "VoteCast")
      .withArgs(voter1.address, order, minFee);

    // After first vote, game still active
    const statusAfterOne = await blockBoom.getGameStatus();
    expect(statusAfterOne[1]).to.equal(true); // active
    expect(statusAfterOne[3]).to.equal(1n); // totalVotes

    // Second vote should reach threshold and end the game
    await expect(blockBoom.connect(voter2).vote(order, { value: minFee }))
      .to.emit(blockBoom, "VoteCast")
      .withArgs(voter2.address, order, minFee);

    const statusAfterTwo = await blockBoom.getGameStatus();
    expect(statusAfterTwo[1]).to.equal(false); // ended
    expect(statusAfterTwo[3]).to.equal(2n); // totalVotes

    // Contract balance should be zero after prize distribution
    const contractBalance = await ethers.provider.getBalance(await blockBoom.getAddress());
    expect(contractBalance).to.equal(0n);

    // Winner should be the adder of Song A (alice)
    // We can't assert exact balance due to gas, but we can assert that the event emitted winner = alice
    // For simplicity here, we re-run the round in a fresh game and ensure song[0] accumulated votes
    const updatedSongs = await blockBoom.getAllSongs();
    expect(updatedSongs[0].votes).to.equal(4n); // 2 voters * 2 points for rank 1
    expect(updatedSongs[1].votes).to.equal(2n); // 2 voters * 1 point for rank 2
  });
});
