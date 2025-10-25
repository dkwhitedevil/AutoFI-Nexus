import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const AutoFiCore = await ethers.getContractFactory("AutoFiCore");
 const contract = await AutoFiCore.deploy();

  await contract.waitForDeployment();

  console.log("✅ AutoFiCore deployed to:", await contract.getAddress());
  console.log("Owner:", await contract.owner());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
