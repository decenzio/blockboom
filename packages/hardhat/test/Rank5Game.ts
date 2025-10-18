import { expect } from "chai";
import { ethers } from "hardhat";
import type { Rank5Game } from "../typechain-types";

describe("Rank5Game", function () {
  let game: Rank5Game;

  beforeEach(async () => {
    const factory = await ethers.getContractFactory("Rank5Game");
    game = (await factory.deploy()) as unknown as Rank5Game;
    await game.waitForDeployment();
  });

  it("deploys with constants and initial state", async () => {
    expect(await game.ENTRY_FEE()).to.equal(1000000000000000n); // 0.001 ETH
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
});
