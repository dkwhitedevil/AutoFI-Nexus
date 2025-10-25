import { expect } from "chai";
import pkg from "hardhat";
import { parseEther } from "ethers";
const { ethers } = pkg;

describe("AutoFiCore Contract", function () {
  let AutoFiCore, autoFi, owner, user1, user2, agent;

  beforeEach(async function () {
    [owner, user1, user2, agent] = await ethers.getSigners();
    AutoFiCore = await ethers.getContractFactory("AutoFiCore");
    autoFi = await AutoFiCore.deploy();
    await autoFi.waitForDeployment();

    // Grant agent role
    await autoFi.connect(owner).grantRole(await autoFi.AGENT_ROLE(), agent.address);
  });

  it("should submit an intent", async function () {
    await autoFi.connect(user1).submitIntent(
      1, user2.address, 0, "0x", Math.floor(Date.now() / 1000), 0
    );
    const intent = await autoFi.intents(1);
    expect(intent.user).to.equal(user1.address);
    expect(intent.chainId).to.equal(1n);
    expect(intent.target).to.equal(user2.address);
    expect(intent.executed).to.equal(false);
    expect(intent.canceled).to.equal(false);
  });

  it("should execute an intent by agent", async function () {
    await autoFi.connect(user1).submitIntent(
      1, user2.address, 0, "0x", Math.floor(Date.now() / 1000) - 10, 0
    );
    await autoFi.connect(agent).executeIntent(1);
    const intent = await autoFi.intents(1);
    expect(intent.executed).to.equal(true);
  });

  it("should execute an intent by owner", async function () {
    await autoFi.connect(user1).submitIntent(
      1, user2.address, 0, "0x", Math.floor(Date.now() / 1000) - 10, 0
    );
    await autoFi.connect(owner).executeIntent(1);
    const intent = await autoFi.intents(1);
    expect(intent.executed).to.equal(true);
  });

  it("should revert if non-agent/non-owner tries to execute", async function () {
    await autoFi.connect(user1).submitIntent(
      1, user2.address, 0, "0x", Math.floor(Date.now() / 1000) - 10, 0
    );
    await expect(autoFi.connect(user2).executeIntent(1))
      .to.be.revertedWith("Not authorized");
  });

  it("should revert execution if too early", async function () {
    const now = Math.floor(Date.now() / 1000);
    await autoFi.connect(user1).submitIntent(1, user2.address, 0, "0x", now + 1000, 0);
    await expect(autoFi.connect(agent).executeIntent(1))
      .to.be.revertedWith("Too early");
  });

  it("should revert execution if expired", async function () {
    const now = Math.floor(Date.now() / 1000);
    await autoFi.connect(user1).submitIntent(
      1, user2.address, 0, "0x", now - 2000, now - 1000
    );
    await expect(autoFi.connect(agent).executeIntent(1))
      .to.be.revertedWith("Intent expired");
  });

  it("should cancel an intent", async function () {
    await autoFi.connect(user1).submitIntent(1, user2.address, 0, "0x", Math.floor(Date.now() / 1000), 0);
    await autoFi.connect(user1).cancelIntent(1);
    const intent = await autoFi.intents(1);
    expect(intent.canceled).to.equal(true);
  });

  it("should revert cancel if already executed", async function () {
    await autoFi.connect(user1).submitIntent(1, user2.address, 0, "0x", Math.floor(Date.now() / 1000) - 10, 0);
    await autoFi.connect(agent).executeIntent(1);
    await expect(autoFi.connect(user1).cancelIntent(1))
      .to.be.revertedWith("Already executed");
  });

  it("should transfer ETH if intent has value", async function () {
    await owner.sendTransaction({
      to: await autoFi.getAddress(),
      value: parseEther("1")
    });

    await autoFi.connect(user1).submitIntent(
      1, user2.address, parseEther("0.5"), "0x", Math.floor(Date.now() / 1000) - 10, 0
    );

    const before = await ethers.provider.getBalance(user2.address);
    await autoFi.connect(agent).executeIntent(1);
    const after = await ethers.provider.getBalance(user2.address);
    expect(after - before).to.equal(parseEther("0.5"));
  });

  it("should handle multiple chainIds", async function () {
    await autoFi.connect(user1).submitIntent(1, user2.address, 0, "0x", 0, 0);
    await autoFi.connect(user1).submitIntent(137, user2.address, 0, "0x", 0, 0);
    const i1 = await autoFi.intents(1);
    const i2 = await autoFi.intents(2);
    expect(i1.chainId).to.equal(1n);
    expect(i2.chainId).to.equal(137n);
  });

  it("should revert on invalid target address", async function () {
    await expect(autoFi.connect(user1).submitIntent(
      1, ethers.ZeroAddress, 0, "0x", Math.floor(Date.now() / 1000), 0
    )).to.be.revertedWith("Invalid target");
  });

  it("should revert on invalid time window", async function () {
    const now = Math.floor(Date.now() / 1000);
    await expect(autoFi.connect(user1).submitIntent(
      1, user2.address, 0, "0x", now + 1000, now
    )).to.be.revertedWith("Invalid time window");
  });
});
