import { ethers, fhevm } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { FhevmType } from "@fhevm/hardhat-plugin";
import type { RankrFHE, RankrFHE__factory } from "../typechain-types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  carol: HardhatEthersSigner;
  dave: HardhatEthersSigner;
};

describe("RankrFHE", function () {
  let game: RankrFHE;
  let gameAddress: string;
  let signers: Signers;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      carol: ethSigners[3],
      dave: ethSigners[4],
    };
  });

  beforeEach(async function () {
    if (!fhevm || !fhevm.isMock) {
      console.warn(`This test suite requires the FHEVM mock environment`);
      this.skip();
    }

    const factory = (await ethers.getContractFactory("RankrFHE")) as RankrFHE__factory;
    game = await factory.deploy();
    gameAddress = await game.getAddress();

    // Add all items to transition phase
    const items = [
      { author: "Alice", title: "One", url: "http://1" },
      { author: "Bob", title: "Two", url: "http://2" },
      { author: "Carol", title: "Three", url: "http://3" },
    ];
    for (const item of items) {
      await game.connect(signers.deployer).addItem(item);
    }
  });

  async function castVote(signer: HardhatEthersSigner, itemId: number, eth = "1") {
    const encryptedInput = await fhevm.createEncryptedInput(gameAddress, signer.address).add32(itemId).encrypt();

    await game
      .connect(signer)
      .vote(encryptedInput.handles[0], encryptedInput.inputProof, { value: ethers.parseEther(eth) });
  }

  it("should allow encrypted voting and decrypt the winning vote count", async function () {
    // Voting: A, B vote for item 1; C, D vote for item 2
    await castVote(signers.alice, 1);
    await castVote(signers.bob, 1);
    await castVote(signers.carol, 2);
    await castVote(signers.dave, 2);

    const item1 = await game.items(1);
    const decryptedVotes1 = await fhevm.userDecryptEuint(FhevmType.euint32, item1.votes, gameAddress, signers.alice);

    const item2 = await game.items(2);
    const decryptedVotes2 = await fhevm.userDecryptEuint(FhevmType.euint32, item2.votes, gameAddress, signers.alice);

    expect(decryptedVotes1).to.eq(2);
    expect(decryptedVotes2).to.eq(2);
  });

  it("should revert if vote is repeated", async function () {
    await castVote(signers.alice, 0);
    await expect(castVote(signers.alice, 1)).to.be.revertedWith("AlreadyVoted");
  });

  it("should reject invalid item ID", async function () {
    const encryptedInput = await fhevm
      .createEncryptedInput(gameAddress, signers.alice.address)
      .add32(99) // Invalid ID
      .encrypt();

    await expect(
      game
        .connect(signers.alice)
        .vote(encryptedInput.handles[0], encryptedInput.inputProof, { value: ethers.parseEther("1") }),
    ).to.be.revertedWith("Invalid item ID");
  });
});
