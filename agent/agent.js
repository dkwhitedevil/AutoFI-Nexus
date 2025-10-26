import "./esm-patch.js";

import 'dotenv/config';
import pkg from 'ethers';

const { Wallet, Contract, utils, providers } = pkg;
const { JsonRpcProvider } = providers;
const { Interface, parseUnits } = utils;
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runVincentSwap } from "./vincentExecutor.js";


// ----- Resolve __dirname -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----- Load ABI -----
const abiPath = path.join(__dirname, '../artifacts/contracts/AutoFiCore.sol/AutoFiCore.json');
const rawData = fs.readFileSync(abiPath, 'utf8');
const abiJson = JSON.parse(rawData);
const abi = abiJson.abi;

// ----- Setup Provider -----
const rpcUrl = process.env.RPC_URL || process.env.SEPOLIA_RPC_URL;
const provider = new JsonRpcProvider(rpcUrl);

// ----- Setup Wallets -----
const ownerWallet = new Wallet(process.env.OWNER_PRIVATE_KEY, provider);
const agentWallet = new Wallet(process.env.AGENT_PRIVATE_KEY, provider);
const userWallet = new Wallet(process.env.USER_PRIVATE_KEY, provider);

// ----- Connect to Contract -----
const contractAddress = process.env.CONTRACT_ADDRESS;
const contractWithOwner = new Contract(contractAddress, abi, ownerWallet);
const contractWithAgent = new Contract(contractAddress, abi, agentWallet);
const contractWithUser = new Contract(contractAddress, abi, userWallet);

// ----- Grant AGENT_ROLE -----
async function grantAgentRole() {
    try {
        const tx = await contractWithOwner.addAgent(agentWallet.address);
        await tx.wait();
        console.log(`✅ Agent role granted: ${agentWallet.address}`);
    } catch (err) {
        console.log('⚠️ Agent role might already exist or error:', err.message);
    }
}

// ----- Submit a new Intent -----
async function submitIntent() {
    const now = Math.floor(Date.now() / 1000);
    const validAfter = now;
    const validUntil = now + 3600;

    console.log('🧾 Submitting new intent...');
    const tx = await contractWithUser.submitIntent(
        11155111,
        userWallet.address,
        0,
        "0x",
        validAfter,
        validUntil
    );

    const receipt = await tx.wait();
    console.log(`📜 Transaction confirmed: ${receipt.transactionHash}`);

    try {
        const iface = new Interface(abi);
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog(log);
                if (parsed.name === "IntentSubmitted") {
                    const intentId = Number(parsed.args.intentId);
                    console.log(`✅ Found IntentSubmitted in logs. intentId = ${intentId}`);
                    return intentId;
                }
            } catch {}
        }

        const nextId = await contractWithUser.nextIntentId();
        const fallbackIntentId = Number(nextId) - 1;
        console.log(`✅ Fallback intentId = ${fallbackIntentId}`);
        return fallbackIntentId;

    } catch (err) {
        console.log('❌ Failed to decode intent:', err.message);
        return null;
    }
}

// ----- Execute Intent -----
async function executeIntent(intentId) {
    if (!intentId) return false;
    try {
        const tx = await contractWithAgent.executeIntent(intentId);
        await tx.wait();
        console.log(`✅ Intent executed: ${intentId}`);
        return true;
    } catch (err) {
        console.log(`❌ Failed to execute intent ${intentId}:`, err.reason || err.message);
        return false;
    }
}

// ----- Get ETH Price -----
async function getEthPrice() {
    try {
        const response = await axios.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        );
        return response.data.ethereum.usd;
    } catch {
        console.log('⚠️ Failed to fetch ETH price, using fallback $2100.');
        return 2100;
    }
}

// ----- Monitor ETH Price -----
async function monitorPriceAndExecute(intentId) {
    const price = await getEthPrice();
    console.log(`Current ETH price: $${price}`);
    const threshold = 2000;

    if (price > threshold) {
        console.log(`📈 Price > ${threshold}, executing Vincent swap...`);
        await runVincentSwap();

        const success = await executeIntent(intentId);
        if (success) {
            console.log('🎯 Intent successfully executed. Stopping agent.');
            process.exit(0);
        }
    } else {
        console.log(`💤 Price below threshold. Waiting...`);
    }
}

// ----- MAIN -----
(async () => {
    console.log('🟢 Starting Vincent Agent...');
    console.log(`🌍 Using RPC: ${rpcUrl}`);

    await grantAgentRole();
    const intentId = await submitIntent();

    if (!intentId) {
        console.log('🚫 Could not determine intentId. Exiting.');
        process.exit(1);
    }

    console.log('✅ Agent ready. Monitoring ETH price...');
    setInterval(() => monitorPriceAndExecute(intentId), 5000);
})();
