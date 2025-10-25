// scripts/interact.js
import { ethers } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  // Signers
  const [owner, user1, user2, agent] = await ethers.getSigners();

  console.log("Owner:", owner.address);

  // Contract address (change if already deployed on Sepolia)
  const contractAddress = process.env.AUTO_FI_CORE_ADDRESS || "YOUR_CONTRACT_ADDRESS_HERE";

  // Get the contract instance
  const AutoFiCore = await ethers.getContractFactory("AutoFiCore");
  const autoFi = await AutoFiCore.attach(contractAddress);

  console.log("Connected to AutoFiCore at:", autoFi.target ? autoFi.target : autoFi.address);

  // 1️⃣ Add agent role (optional, only owner can do this)
  const tx1 = await autoFi.addAgent(agent.address);
  await tx1.wait();
  console.log("Agent added:", agent.address);

  // 2️⃣ Send ETH to contract
  const tx2 = await owner.sendTransaction({
    to: autoFi.address,
    value: ethers.parseEther("1") // 1 ETH
  });
  await tx2.wait();

  const balance = await ethers.provider.getBalance(autoFi.address);
  console.log("Contract balance:", ethers.formatEther(balance), "ETH");

  // 3️⃣ Submit an intent
  const tx3 = await autoFi.connect(user1).submitIntent(
    1,                    // chainId
    user2.address,        // target
    ethers.parseEther("0.5"), // value to transfer
    "0x",                 // calldata (empty)
    Math.floor(Date.now() / 1000) - 10, // validAfter (already valid)
    0                     // validUntil (no expiry)
  );
  const receipt3 = await tx3.wait();
  console.log("Intent submitted. Transaction hash:", receipt3.transactionHash);

  // 4️⃣ Execute the intent as agent
  const intentId = 1; // assuming first intent
  const tx4 = await autoFi.connect(agent).executeIntent(intentId);
  await tx4.wait();
  console.log(`Intent ${intentId} executed by agent:`, agent.address);

  const user2Balance = await ethers.provider.getBalance(user2.address);
  console.log("User2 balance after intent:", ethers.formatEther(user2Balance), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
