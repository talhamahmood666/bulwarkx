import { ethers } from "hardhat";

function asBytes32(hex: string): string {
  if (!hex.startsWith("0x")) throw new Error("orderId must start with 0x");
  if (hex.length !== 66) throw new Error("orderId must be 32 bytes (66 chars incl 0x)");
  return hex;
}

function getPrivateKeyFromEnv(): string | null {
  const pk = process.env.PRIVATE_KEY?.trim();
  if (!pk) return null;

  // normalize
  if (pk.startsWith("0x")) {
    if (pk.length !== 66) throw new Error("PRIVATE_KEY looks wrong length (expected 32 bytes hex)");
    return pk;
  }
  if (pk.length === 64) return "0x" + pk;
  throw new Error("PRIVATE_KEY format invalid (expected 64 hex chars, with or without 0x)");
}

async function getSigner() {
  // 1) try configured signers (if any)
  const signers = await ethers.getSigners();
  if (signers && signers.length > 0) return signers[0];

  // 2) fallback to Codespaces secret injected as env var
  const pk = getPrivateKeyFromEnv();
  if (!pk) return null;

  return new ethers.Wallet(pk, ethers.provider);
}

async function main() {
  // ---- Config ----
  const ESCROW_ADDRESS = "0x4092898476761dA6Be8Ef2cD608Ea812D6164b3e";
  const PAYEE = "0x89c8f103387fb6fec8c40aa7a1748ad3884211bb";
  const AMOUNT_ETH = "0.01";

  const signer = await getSigner();

  if (!signer) {
    console.log("❌ No signer available.");
    console.log("Hardhat has 0 configured accounts for this network AND PRIVATE_KEY env var is not available.");
    console.log("Make sure your Codespaces secret is exposed as an env var named PRIVATE_KEY.");
    process.exit(1);
  }

  const payer = await signer.getAddress();
  const payee = ethers.getAddress(PAYEE);
  const arbiter = payer; // demo arbiter = payer
  const amountWei = ethers.parseEther(AMOUNT_ETH);
  const orderId = asBytes32(ethers.hexlify(ethers.randomBytes(32)));

  // Contract (read interface using artifact)
  const escrow = await ethers.getContractAt("BulwarkXEscrow", ESCROW_ADDRESS);

  // Nonce (on-chain)
  const nonce: bigint = await escrow.nonces(payer);

  // EscrowId (token=0 for native)
  const escrowId = ethers.solidityPackedKeccak256(
    ["bytes32", "address", "address", "address", "uint256", "uint256"],
    [orderId, payer, payee, ethers.ZeroAddress, amountWei, nonce]
  );

  // Encode calldata for overloaded fn explicitly
  const fnSig = "createEscrowWithId(bytes32,address,address,uint256)";
  const data = escrow.interface.encodeFunctionData(fnSig, [orderId, payee, arbiter, amountWei]);

  const net = await ethers.provider.getNetwork();

  console.log("Network chainId:", net.chainId.toString());
  console.log("Escrow contract:", ESCROW_ADDRESS);
  console.log("Payer:", payer);
  console.log("Payee:", payee);
  console.log("Arbiter:", arbiter);
  console.log("Amount (ETH):", AMOUNT_ETH);
  console.log("orderId:", orderId);
  console.log("nonce:", nonce.toString());
  console.log("escrowId:", escrowId);

  // Always print payload too (non-custodial friendly)
  console.log("\n=== TX PAYLOAD (wallet-ready) ===");
  console.log(
    JSON.stringify(
      {
        chainId: net.chainId.toString(),
        to: ESCROW_ADDRESS,
        data,
        value: amountWei.toString(),
      },
      null,
      2
    )
  );

  // Broadcast
  console.log("\nBroadcasting tx from signer:", payer);
  const tx = await signer.sendTransaction({ to: ESCROW_ADDRESS, data, value: amountWei });
  console.log("Submitted tx:", tx.hash);

  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt?.blockNumber);

  console.log("✅ Demo complete (broadcast).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
