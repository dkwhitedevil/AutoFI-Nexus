import 'dotenv/config';
import { ethers } from 'ethers';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ----- Resolve __dirname in ES module -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----- Load ABI -----
const abiPath = path.join(__dirname, '../artifacts/contracts/AutoFiCore.sol/AutoFiCore.json');
const rawData = fs.readFileSync(abiPath, 'utf8');
const abiJson = JSON.parse(rawData);
const abi = abiJson.abi;

// ----- Setup Provider -----
const rpcUrl = process.env.RPC_URL || process.env.SEPOLIA_RPC_URL;
const provider = new ethers.JsonRpcProvider(rpcUrl);

// ----- Setup Wallets -----
const ownerWallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
const agentWallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);
const userWallet = new ethers.Wallet(process.env.USER_PRIVATE_KEY, provider);

// ----- Connect to Contract -----
const contractAddress = process.env.CONTRACT_ADDRESS;
const contractWithOwner = new ethers.Contract(contractAddress, abi, ownerWallet);
const contractWithAgent = new ethers.Contract(contractAddress, abi, agentWallet);
const contractWithUser = new ethers.Contract(contractAddress, abi, userWallet);

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
        11155111,            // chainId (Sepolia or local)
        userWallet.address,  // target
        0,                   // value
        "0x",                // empty data
        validAfter,
        validUntil
    );

    const receipt = await tx.wait();
    console.log(`📜 Transaction confirmed: ${receipt.hash}`);
    console.log(`📦 receipt.logs length: ${receipt.logs.length}`);

    if (receipt.logs.length > 0) {
        const log = receipt.logs[0];
        console.log('--- log 0 ---');
        console.log('address:', log.address);
        console.log('topics:', log.topics);
        console.log('data:', log.data);

        try {
            const eventFragment = abi.find(f => f.name === "IntentSubmitted");
            const iface = new ethers.Interface(abi);
            const parsed = iface.decodeEventLog(eventFragment, log.data, log.topics);
            const intentId = Number(parsed.intentId);
            console.log(`✅ Found IntentSubmitted in logs. intentId = ${intentId}`);
            return intentId;
        } catch (decodeErr) {
            console.log('⚠️ Could not decode IntentSubmitted event:', decodeErr.message);
        }
    }

    console.log('⚠️ No IntentSubmitted event found. Using fallback...');
    try {
        const nextId = await contractWithUser.nextIntentId();
        const intentId = Number(nextId) - 1;
        console.log(`✅ Fallback intentId = ${intentId}`);
        return intentId;
    } catch (err) {
        console.log('❌ Fallback failed:', err.message);
        return null;
    }
}

// ----- Execute Intent -----
async function executeIntent(intentId) {
    if (!intentId) {
        console.log('🚫 No valid intentId available. Skipping execution.');
        return;
    }
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

// ----- Monitor ETH Price and Execute -----
async function monitorPriceAndExecute(intentId) {
    const price = await getEthPrice();
    console.log(`Current ETH price: $${price}`);
    const threshold = 2000;

    if (price > threshold) {
        console.log(`📈 Price > ${threshold}, executing intent ${intentId}...`);
        const success = await executeIntent(intentId);
        if (success) {
            console.log('🎯 Intent successfully executed. Agent stopping monitoring.');
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
