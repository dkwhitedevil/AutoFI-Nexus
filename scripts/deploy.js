import hardhat from "hardhat";
const { ethers } = hardhat;

const [deployer] = await ethers.getSigners();
console.log("Deploying with:", deployer.address);

const AutoFiCore = await ethers.getContractFactory("AutoFiCore");
const contract = await AutoFiCore.deploy();
await contract.deployed();

console.log("✅ AutoFiCore deployed to:", contract.address);