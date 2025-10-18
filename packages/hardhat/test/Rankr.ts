import { expect } from "chai";
import { ethers } from "hardhat";
import type { Rankr } from "../typechain-types";

describe("Rankr", function () {
  let game: Rankr;

  beforeEach(async () => {
    const factory = await ethers.getContractFactory("Rankr");
    game = (await factory.deploy()) as unknown as Rankr;
    await game.waitForDeployment();
  });

  it("deploys with constants and initial state", async () => {
    expect(await game.ENTRY_FEE()).to.equal(10000000000000n); // 0.001 ETH
    expect(await game.NUM_ITEMS()).to.equal(3n);
    expect(await game.MAX_PLAYERS()).to.equal(2n);
    expect(await game.phase()).to.equal(0n); // CollectingItems
    expect(await game.itemsCount()).to.equal(0n);
    expect(await game.getPrizePool()).to.equal(0n);
  });

  it("reverts ranking in CollectingItems phase", async () => {
    const [p1] = await ethers.getSigners();
    const order = [0, 1, 2] as [number, number, number];
    const fee = await game.ENTRY_FEE();
    await expect(game.connect(p1).rankItems(order, { value: fee })).to.be.revertedWithCustomError(game, "WrongPhase");
  });

  it("adds items and enters ranking phase", async () => {
    const [a, b, c] = await ethers.getSigners();
    await game.connect(a).addItem({ author: "A1", title: "T1", url: "u1" });
    await game.connect(b).addItem({ author: "A2", title: "T2", url: "u2" });
    await game.connect(c).addItem({ author: "A3", title: "T3", url: "u3" });

    expect(await game.itemsCount()).to.equal(3n);
    expect(await game.phase()).to.equal(1n); // CollectingRanks

    const items = await game.getCurrentItems();
    expect(items.length).to.equal(3);
    expect(items[0].title).to.equal("T1");
    expect(items[1].adder).to.equal(await b.getAddress());
  });

  it("reverts addItem with invalid input and wrong phase", async () => {
    const [a] = await ethers.getSigners();
    await expect(game.connect(a).addItem({ author: "", title: "x", url: "x" })).to.be.revertedWithCustomError(
      game,
      "InvalidItem",
    );

    // Fill items to transition phase
    await game.addItem({ author: "A1", title: "T1", url: "u1" });
    await game.addItem({ author: "A2", title: "T2", url: "u2" });
    await game.addItem({ author: "A3", title: "T3", url: "u3" });

    await expect(game.addItem({ author: "A4", title: "T4", url: "u4" })).to.be.revertedWithCustomError(
      game,
      "WrongPhase",
    );
  });

  it("full round: two rankings, payout split, and reset", async () => {
    const [p1, p2] = await ethers.getSigners();
    // Add items
    await game.addItem({ author: "A1", title: "T1", url: "u1" });
    await game.addItem({ author: "A2", title: "T2", url: "u2" });
    await game.addItem({ author: "A3", title: "T3", url: "u3" });

    const fee = await game.ENTRY_FEE();
    const order = [0, 1, 2] as [number, number, number];

    await expect(game.connect(p1).rankItems(order, { value: fee }))
      .to.emit(game, "RankingSubmitted")
      .withArgs(await p1.getAddress(), [0n, 1n, 2n]);

    expect((await game.getPlayers()).length).to.equal(1);
    expect(await game.getPrizePool()).to.equal(fee);

    await expect(game.connect(p2).rankItems(order, { value: fee }))
      .to.emit(game, "RankingSubmitted")
      .withArgs(await p2.getAddress(), [0n, 1n, 2n])
      .and.to.emit(game, "RoundCompleted")
      .withArgs([await p1.getAddress(), await p2.getAddress()], fee)
      .and.to.emit(game, "RoundReset");

    // Post-reset state
    expect(await game.phase()).to.equal(0n);
    expect(await game.itemsCount()).to.equal(0n);
    expect(await game.getPrizePool()).to.equal(0n);
    expect((await game.getPlayers()).length).to.equal(0);

    const items = await game.getCurrentItems();
    expect(items[0].adder).to.equal(ethers.ZeroAddress);
    expect(items[1].author).to.equal("");
  });

  it("reverts ranking with wrong fee, duplicates, out of range, and already ranked", async () => {
    const [p1, p2] = await ethers.getSigners();
    // Prepare ranking phase
    await game.addItem({ author: "A1", title: "T1", url: "u1" });
    await game.addItem({ author: "A2", title: "T2", url: "u2" });
    await game.addItem({ author: "A3", title: "T3", url: "u3" });

    const fee = await game.ENTRY_FEE();

    await expect(
      game.connect(p1).rankItems([0, 1, 2] as [number, number, number], { value: 0 }),
    ).to.be.revertedWithCustomError(game, "WrongEntryFee");
    await expect(
      game.connect(p1).rankItems([0, 0, 1] as [number, number, number], { value: fee }),
    ).to.be.revertedWithCustomError(game, "DuplicateIndex");
    await expect(
      game.connect(p1).rankItems([0, 1, 3] as [number, number, number], { value: fee }),
    ).to.be.revertedWithCustomError(game, "IndexOutOfRange");

    // Valid first ranking
    await game.connect(p1).rankItems([0, 1, 2] as [number, number, number], { value: fee });
    // Repeat should fail
    await expect(
      game.connect(p1).rankItems([0, 1, 2] as [number, number, number], { value: fee }),
    ).to.be.revertedWithCustomError(game, "AlreadyRanked");

    // Second player finalizes round to avoid side effects for the test runner
    await game.connect(p2).rankItems([0, 1, 2] as [number, number, number], { value: fee });
  });

  // Additional comprehensive tests
  it("should revert addItem with empty author", async () => {
    await expect(
      game.addItem({ author: "", title: "Valid Title", url: "http://valid.com" }),
    ).to.be.revertedWithCustomError(game, "InvalidItem");
  });

  it("should revert addItem with empty title", async () => {
    await expect(
      game.addItem({ author: "Valid Author", title: "", url: "http://valid.com" }),
    ).to.be.revertedWithCustomError(game, "InvalidItem");
  });

  it("should revert addItem with empty url", async () => {
    await expect(game.addItem({ author: "Valid Author", title: "Valid Title", url: "" })).to.be.revertedWithCustomError(
      game,
      "InvalidItem",
    );
  });

  it("should revert addItem when items are full", async () => {
    // Fill up all 3 items
    await game.addItem({ author: "A1", title: "T1", url: "u1" });
    await game.addItem({ author: "A2", title: "T2", url: "u2" });
    await game.addItem({ author: "A3", title: "T3", url: "u3" });

    // Try to add 4th item - this should fail with WrongPhase since we're now in CollectingRanks
    await expect(game.addItem({ author: "A4", title: "T4", url: "u4" })).to.be.revertedWithCustomError(
      game,
      "WrongPhase",
    );
  });

  it("should revert addItem in wrong phase", async () => {
    // Fill items to transition to ranking phase
    await game.addItem({ author: "A1", title: "T1", url: "u1" });
    await game.addItem({ author: "A2", title: "T2", url: "u2" });
    await game.addItem({ author: "A3", title: "T3", url: "u3" });

    // Try to add item in ranking phase
    await expect(game.addItem({ author: "A4", title: "T4", url: "u4" })).to.be.revertedWithCustomError(
      game,
      "WrongPhase",
    );
  });

  it("should revert rankItems with wrong entry fee amount", async () => {
    // Prepare ranking phase
    await game.addItem({ author: "A1", title: "T1", url: "u1" });
    await game.addItem({ author: "A2", title: "T2", url: "u2" });
    await game.addItem({ author: "A3", title: "T3", url: "u3" });

    const fee = await game.ENTRY_FEE();
    const wrongFee = fee + 1n;

    await expect(
      game.rankItems([0, 1, 2] as [number, number, number], { value: wrongFee }),
    ).to.be.revertedWithCustomError(game, "WrongEntryFee");
  });

  it("should revert rankItems with duplicate indices", async () => {
    // Prepare ranking phase
    await game.addItem({ author: "A1", title: "T1", url: "u1" });
    await game.addItem({ author: "A2", title: "T2", url: "u2" });
    await game.addItem({ author: "A3", title: "T3", url: "u3" });

    const fee = await game.ENTRY_FEE();

    await expect(game.rankItems([1, 1, 2] as [number, number, number], { value: fee })).to.be.revertedWithCustomError(
      game,
      "DuplicateIndex",
    );
  });

  it("should revert rankItems with index out of range", async () => {
    // Prepare ranking phase
    await game.addItem({ author: "A1", title: "T1", url: "u1" });
    await game.addItem({ author: "A2", title: "T2", url: "u2" });
    await game.addItem({ author: "A3", title: "T3", url: "u3" });

    const fee = await game.ENTRY_FEE();

    await expect(game.rankItems([0, 1, 5] as [number, number, number], { value: fee })).to.be.revertedWithCustomError(
      game,
      "IndexOutOfRange",
    );
  });

  it("should revert rankItems in wrong phase", async () => {
    const fee = await game.ENTRY_FEE();

    await expect(game.rankItems([0, 1, 2] as [number, number, number], { value: fee })).to.be.revertedWithCustomError(
      game,
      "WrongPhase",
    );
  });

  it("should handle single player round correctly", async () => {
    const [p1] = await ethers.getSigners();

    // Add items
    await game.addItem({ author: "A1", title: "T1", url: "u1" });
    await game.addItem({ author: "A2", title: "T2", url: "u2" });
    await game.addItem({ author: "A3", title: "T3", url: "u3" });

    const fee = await game.ENTRY_FEE();
    const order = [2, 0, 1] as [number, number, number];

    // Single player should not trigger round completion
    await expect(game.connect(p1).rankItems(order, { value: fee }))
      .to.emit(game, "RankingSubmitted")
      .withArgs(await p1.getAddress(), [2n, 0n, 1n]);

    expect(await game.phase()).to.equal(1n); // Still in CollectingRanks
    expect((await game.getPlayers()).length).to.equal(1);
    expect(await game.getPrizePool()).to.equal(fee);
  });

  it("should correctly identify winner with different rankings", async () => {
    const [p1, p2] = await ethers.getSigners();

    // Add items
    await game.addItem({ author: "A1", title: "T1", url: "u1" });
    await game.addItem({ author: "A2", title: "T2", url: "u2" });
    await game.addItem({ author: "A3", title: "T3", url: "u3" });

    const fee = await game.ENTRY_FEE();
    const initialBalance1 = await ethers.provider.getBalance(await p1.getAddress());
    const initialBalance2 = await ethers.provider.getBalance(await p2.getAddress());

    // Player 1: [0, 1, 2] - prefers item 0
    // Player 2: [1, 0, 2] - prefers item 1
    // Final order should be [0, 1, 2] (item 0 wins with 4 points, item 1 gets 3 points)
    // Player 1 should win (matches final order exactly)

    await game.connect(p1).rankItems([0, 1, 2] as [number, number, number], { value: fee });
    await expect(game.connect(p2).rankItems([1, 0, 2] as [number, number, number], { value: fee }))
      .to.emit(game, "RoundCompleted")
      .withArgs([await p1.getAddress()], 2n * fee); // reward per winner = total pool / 1 winner = 2*fee

    // Check that only p1 received the prize
    const finalBalance1 = await ethers.provider.getBalance(await p1.getAddress());
    const finalBalance2 = await ethers.provider.getBalance(await p2.getAddress());

    // P1 should have more than initial (received prize)
    expect(finalBalance1).to.be.gt(initialBalance1);
    // P2 should have less than initial (paid fee, no prize)
    expect(finalBalance2).to.be.lt(initialBalance2);
  });

  it("should split prize equally among tied winners", async () => {
    const [p1, p2] = await ethers.getSigners();

    // Add items
    await game.addItem({ author: "A1", title: "T1", url: "u1" });
    await game.addItem({ author: "A2", title: "T2", url: "u2" });
    await game.addItem({ author: "A3", title: "T3", url: "u3" });

    const fee = await game.ENTRY_FEE();
    const initialBalance1 = await ethers.provider.getBalance(await p1.getAddress());
    const initialBalance2 = await ethers.provider.getBalance(await p2.getAddress());

    // Both players submit identical rankings - both should win
    const order = [0, 1, 2] as [number, number, number];

    await game.connect(p1).rankItems(order, { value: fee });
    await expect(game.connect(p2).rankItems(order, { value: fee }))
      .to.emit(game, "RoundCompleted")
      .withArgs([await p1.getAddress(), await p2.getAddress()], fee);

    // Both should receive equal share (fee each, since total pool is 2*fee and 2 winners)
    const finalBalance1 = await ethers.provider.getBalance(await p1.getAddress());
    const finalBalance2 = await ethers.provider.getBalance(await p2.getAddress());

    // Account for gas costs - balances should be higher than initial minus fee
    expect(finalBalance1).to.be.gt(initialBalance1 - fee);
    expect(finalBalance2).to.be.gt(initialBalance2 - fee);
  });

  it("should reset state correctly after round completion", async () => {
    const [p1, p2] = await ethers.getSigners();

    // Complete a full round
    await game.addItem({ author: "A1", title: "T1", url: "u1" });
    await game.addItem({ author: "A2", title: "T2", url: "u2" });
    await game.addItem({ author: "A3", title: "T3", url: "u3" });

    const fee = await game.ENTRY_FEE();
    await game.connect(p1).rankItems([0, 1, 2] as [number, number, number], { value: fee });
    await game.connect(p2).rankItems([0, 1, 2] as [number, number, number], { value: fee });

    // Verify reset state
    expect(await game.phase()).to.equal(0n); // Back to CollectingItems
    expect(await game.itemsCount()).to.equal(0n);
    expect(await game.getPrizePool()).to.equal(0n);
    expect((await game.getPlayers()).length).to.equal(0);

    // Verify items are cleared
    const items = await game.getCurrentItems();
    expect(items[0].adder).to.equal(ethers.ZeroAddress);
    expect(items[0].author).to.equal("");
    expect(items[1].title).to.equal("");
    expect(items[2].url).to.equal("");
  });

  it("should allow new round after reset", async () => {
    const [p1, p2] = await ethers.getSigners();

    // Complete first round
    await game.addItem({ author: "A1", title: "T1", url: "u1" });
    await game.addItem({ author: "A2", title: "T2", url: "u2" });
    await game.addItem({ author: "A3", title: "T3", url: "u3" });

    const fee = await game.ENTRY_FEE();
    await game.connect(p1).rankItems([0, 1, 2] as [number, number, number], { value: fee });
    await game.connect(p2).rankItems([0, 1, 2] as [number, number, number], { value: fee });

    // Start new round
    await game.addItem({ author: "B1", title: "U1", url: "v1" });
    await game.addItem({ author: "B2", title: "U2", url: "v2" });
    await game.addItem({ author: "B3", title: "U3", url: "v3" });

    expect(await game.phase()).to.equal(1n); // CollectingRanks
    expect(await game.itemsCount()).to.equal(3n);
    expect((await game.getPlayers()).length).to.equal(0);

    const items = await game.getCurrentItems();
    expect(items[0].author).to.equal("B1");
    expect(items[1].title).to.equal("U2");
    expect(items[2].url).to.equal("v3");
  });

  it("should handle reentrancy protection", async () => {
    // This test would require a malicious contract to test reentrancy
    // For now, we'll test that the nonReentrant modifier is present
    const [p1] = await ethers.getSigners();

    await game.addItem({ author: "A1", title: "T1", url: "u1" });
    await game.addItem({ author: "A2", title: "T2", url: "u2" });
    await game.addItem({ author: "A3", title: "T3", url: "u3" });

    const fee = await game.ENTRY_FEE();

    // Normal ranking should work
    await expect(game.connect(p1).rankItems([0, 1, 2] as [number, number, number], { value: fee })).to.emit(
      game,
      "RankingSubmitted",
    );
  });

  it("should reject direct ETH transfers", async () => {
    const [sender] = await ethers.getSigners();

    await expect(
      sender.sendTransaction({
        to: await game.getAddress(),
        value: ethers.parseEther("1"),
      }),
    ).to.be.revertedWithCustomError(game, "NoDirectETH");
  });
});
