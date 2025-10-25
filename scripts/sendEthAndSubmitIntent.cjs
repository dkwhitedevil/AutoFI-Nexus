// scripts/sendEthAndSubmitIntent.cjs
const { ethers } = require("hardhat");

async function main() {
  const [owner, user1, user2, agent] = await ethers.getSigners();

  console.log("Owner:", owner.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);
  console.log("Agent:", agent.address);

  // Deploy locally
  const AutoFiCoreFactory = await ethers.getContractFactory("AutoFiCore");
  const autoFi = await AutoFiCoreFactory.deploy();
  await autoFi.waitForDeployment();

  console.log("Contract deployed at:", autoFi.address);

  // Send 1 ETH from owner to contract
  const tx = await owner.sendTransaction({
    to: autoFi.address,
    value: ethers.parseEther("1") // 1 ETH
  });
  await tx.wait();
  console.log("1 ETH sent to contract!");

  // Submit intent from user1 to user2
  const validAfter = Math.floor(Date.now() / 1000);
  const intentTx = await autoFi.connect(user1).submitIntent(
    1,
    user2.address,
    ethers.parseEther("0.01"),
    "0x",
    validAfter,
    0
  );
  await intentTx.wait();
  console.log("Intent submitted from User1 to User2!");
}

main().catch(console.error);
