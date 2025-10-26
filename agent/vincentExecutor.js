import { LitNodeClient } from "@lit-protocol/lit-node-client";
import {
    bundledVincentAbility as erc20BundledAbility,
} from "@lit-protocol/vincent-ability-erc20-approval";
import {
    getSignedUniswapQuote,
    bundledVincentAbility as uniswapBundledAbility,
} from "@lit-protocol/vincent-ability-uniswap-swap";
import { getVincentAbilityClient } from "@lit-protocol/vincent-app-sdk/abilityClient";
import pkg from "ethers";
const { Wallet, providers, parseUnits } = pkg;
const { JsonRpcProvider } = providers;

export async function runVincentSwap() {
  console.log("🔗 Connecting to Vincent for Uniswap Swap...");

  const DELEGATEE_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;
  const delegatorPkpEthAddress = process.env.USER_ADDRESS || "0x5De4111afa1A4b94908f83103eb1f1706367C2e68";
  const RPC_URL = "https://base.llamarpc.com";
  const CHAIN_ID = 8453;
  const TOKEN_IN = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
  const TOKEN_OUT = "0x4200000000000000000000000000000000000006";
  const TOKEN_IN_DECIMALS = 6;
  const SWAP_AMOUNT = 0.1;

  const provider = new JsonRpcProvider(RPC_URL);
  const delegateeSigner = new Wallet(DELEGATEE_PRIVATE_KEY, provider);

  console.log("🔌 Connecting to Lit Protocol Network...");
  const litNodeClient = new LitNodeClient({ litNetwork: "datil", debug: true });
  await litNodeClient.connect();

  const signedUniswapQuote = await getSignedUniswapQuote({
    quoteParams: {
      rpcUrl: RPC_URL,
      tokenInAddress: TOKEN_IN,
      tokenInAmount: SWAP_AMOUNT.toString(),
      tokenOutAddress: TOKEN_OUT,
      recipient: delegatorPkpEthAddress,
    },
    ethersSigner: delegateeSigner,
    litNodeClient,
  });

  const uniswapRouterAddress = signedUniswapQuote.quote.to;

  const erc20ApprovalAbilityClient = getVincentAbilityClient({
    bundledVincentAbility: erc20BundledAbility,
    ethersSigner: delegateeSigner,
  });

  const approvalPrecheck = await erc20ApprovalAbilityClient.precheck(
    {
      rpcUrl: RPC_URL,
      chainId: CHAIN_ID,
      spenderAddress: uniswapRouterAddress,
      tokenAddress: TOKEN_IN,
      tokenAmount: parseUnits(SWAP_AMOUNT.toString(), TOKEN_IN_DECIMALS).toString(),
      alchemyGasSponsor: false,
    },
    { delegatorPkpEthAddress }
  );

  if (!approvalPrecheck.result.alreadyApproved) {
    console.log("🔓 Approving token for Uniswap swap...");
    const approvalExecution = await erc20ApprovalAbilityClient.execute(
      {
        rpcUrl: RPC_URL,
        chainId: CHAIN_ID,
        spenderAddress: uniswapRouterAddress,
        tokenAddress: TOKEN_IN,
        tokenAmount: parseUnits(SWAP_AMOUNT.toString(), TOKEN_IN_DECIMALS).toString(),
        alchemyGasSponsor: false,
      },
      { delegatorPkpEthAddress }
    );
    console.log("✅ Approval tx hash:", approvalExecution.result.approvalTxHash);
  } else {
    console.log("✅ Already approved, skipping ERC20 approval");
  }

  const uniswapSwapAbilityClient = getVincentAbilityClient({
    bundledVincentAbility: uniswapBundledAbility,
    ethersSigner: delegateeSigner,
  });

  console.log("🚀 Executing Uniswap Swap...");
  const swapExecutionResult = await uniswapSwapAbilityClient.execute(
    {
      rpcUrlForUniswap: RPC_URL,
      signedUniswapQuote: {
        quote: signedUniswapQuote.quote,
        signature: signedUniswapQuote.signature,
      },
    },
    { delegatorPkpEthAddress }
  );

  console.log("✅ Swap success:", swapExecutionResult.result.swapTxHash);
  console.log("🌐 View on BaseScan:", `https://basescan.org/tx/${swapExecutionResult.result.swapTxHash}`);

  litNodeClient.disconnect();
  console.log("🔒 Disconnected from Lit Network");
}
