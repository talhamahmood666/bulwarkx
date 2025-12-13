import { ethers } from "hardhat";

function normalizePrivateKey(pk: string | undefined | null): string | null {
  const trimmed = pk?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("0x")) return trimmed;
  if (trimmed.length === 64) return "0x" + trimmed;
  return null;
}

async function getSigner() {
  const payeePk = normalizePrivateKey(process.env.PAYEE_PRIVATE_KEY);
  const defaultPk = normalizePrivateKey(process.env.PRIVATE_KEY);
  const pk = payeePk ?? defaultPk;

  if (pk) {
    return new ethers.Wallet(pk, ethers.provider);
  }

  const signers = await ethers.getSigners();
  if (signers && signers.length > 0) return signers[0];

  return null;
}

async function main() {
  const signer = await getSigner();
  if (!signer) {
    console.log(
      "❌ No signer available. Set PAYEE_PRIVATE_KEY (or PRIVATE_KEY) in your environment."
    );
    process.exit(1);
  }

  const ESCROW_ADDRESS = "0x4092898476761dA6Be8Ef2cD608Ea812D6164b3e";

  const escrowId = process.env.ESCROW_ID?.trim() || process.argv[2]?.trim();

  if (!escrowId || !escrowId.startsWith("0x") || escrowId.length !== 66) {
    console.log("❌ Provide ESCROW_ID as env or arg:");
    console.log(
      "   ESCROW_ID=0x... npx hardhat run scripts/demo-refund.ts --network baseSepolia"
    );
    console.log("   OR");
    console.log(
      "   npx hardhat run scripts/demo-refund.ts --network baseSepolia -- 0xYourEscrowId"
    );
    process.exit(1);
  }

  const payee = await signer.getAddress();
  const escrowRO = await ethers.getContractAt("BulwarkXEscrow", ESCROW_ADDRESS);
  const escrow = escrowRO.connect(signer);

  const net = await ethers.provider.getNetwork();
  const chainId = net.chainId.toString();

  console.log("Network chainId:", chainId);
  console.log("Escrow contract:", ESCROW_ADDRESS);
  console.log("Signer (payee):", payee);
  console.log("EscrowId:", escrowId);

  const data = escrow.interface.encodeFunctionData("refundEscrow", [escrowId]);

  console.log("\n=== TX PAYLOAD (wallet-ready) ===");
  console.log(
    JSON.stringify({ chainId, to: ESCROW_ADDRESS, data, value: "0" }, null, 2)
  );

  const tx = await signer.sendTransaction({ to: ESCROW_ADDRESS, data, value: 0 });
  console.log("\nSubmitted tx:", tx.hash);

  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt?.blockNumber);

  const basescan = "https://sepolia.basescan.org";
  console.log("\n=== Explorer Links ===");
  console.log("Tx:", `${basescan}/tx/${tx.hash}`);
  console.log("Contract:", `${basescan}/address/${ESCROW_ADDRESS}`);
  console.log("EscrowId:", escrowId);

  try {
    const e = await escrowRO.escrows(escrowId);
    console.log("\n=== On-chain escrow (escrows mapping) ===");
    console.log({
      payer: e.payer,
      payee: e.payee,
      arbiter: e.arbiter,
      token: e.token,
      amount: e.amount?.toString?.() ?? String(e.amount),
      createdAt: e.createdAt?.toString?.() ?? String(e.createdAt),
      updatedAt: e.updatedAt?.toString?.() ?? String(e.updatedAt),
      status: e.status?.toString?.() ?? String(e.status),
    });
  } catch (err) {
    console.log("\n⚠️ Could not read escrow back from escrows mapping.");
    console.error(err);
  }

  console.log("\n✅ Demo complete (refund + read-back).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
