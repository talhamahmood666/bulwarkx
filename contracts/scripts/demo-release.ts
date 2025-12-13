import { ethers } from "hardhat";

function getPrivateKeyFromEnv(): string | null {
  const pk = process.env.PRIVATE_KEY?.trim();
  if (!pk) return null;
  if (pk.startsWith("0x")) return pk;
  if (pk.length === 64) return "0x" + pk;
  return null;
}

async function getSigner() {
  const signers = await ethers.getSigners();
  if (signers && signers.length > 0) return signers[0];

  const pk = getPrivateKeyFromEnv();
  if (!pk) return null;

  return new ethers.Wallet(pk, ethers.provider);
}

function pickFunctionSig(
  iface: ethers.Interface,
  name: string,
  argTypes: string[]
): string {
  const fns = iface.fragments.filter(
    (f) => f.type === "function" && (f as any).name === name
  ) as ethers.FunctionFragment[];

  for (const fn of fns) {
    const inputs = fn.inputs.map((i) => i.type);
    if (inputs.length === argTypes.length && inputs.every((t, i) => t === argTypes[i])) {
      return fn.format();
    }
  }

  throw new Error(
    `Could not find function ${name}(${argTypes.join(",")}) in ABI. Found: ` +
      fns.map((f) => f.format()).join(" | ")
  );
}

async function tryReadEscrow(escrow: any, escrowId: string) {
  try {
    const e = await escrow.getEscrow(escrowId);
    console.log("\n=== On-chain escrow (getEscrow) ===");
    console.log({
      payer: e.payer,
      payee: e.payee,
      arbiter: e.arbiter,
      token: e.token,
      amount: e.amount?.toString?.() ?? String(e.amount),
      status: e.status?.toString?.() ?? String(e.status),
      createdAt: e.createdAt?.toString?.() ?? String(e.createdAt),
      updatedAt: e.updatedAt?.toString?.() ?? String(e.updatedAt),
    });
    return;
  } catch {}

  try {
    const e = await escrow.escrows(escrowId);
    console.log("\n=== On-chain escrow (escrows mapping) ===");
    console.log(e);
    return;
  } catch {}

  console.log("\n⚠️ Could not read escrow back (no getEscrow/escrows public).");
}

async function main() {
  const signer = await getSigner();
  if (!signer) {
    console.log("❌ No signer available. Ensure PRIVATE_KEY is exposed in Codespaces.");
    process.exit(1);
  }

  const ESCROW_ADDRESS = "0x4092898476761dA6Be8Ef2cD608Ea812D6164b3e";

  // EscrowId must be provided
  const escrowId =
    process.env.ESCROW_ID?.trim() ||
    process.argv[2]?.trim();

  if (!escrowId || !escrowId.startsWith("0x") || escrowId.length !== 66) {
    console.log("❌ Provide ESCROW_ID as env or arg:");
    console.log("   ESCROW_ID=0x... npx hardhat run scripts/demo-release.ts --network baseSepolia");
    console.log("   OR");
    console.log("   npx hardhat run scripts/demo-release.ts --network baseSepolia -- 0xYourEscrowId");
    process.exit(1);
  }

  const payer = await signer.getAddress();
  const escrowRO = await ethers.getContractAt("BulwarkXEscrow", ESCROW_ADDRESS);
  const escrow = escrowRO.connect(signer);

  const net = await ethers.provider.getNetwork();
  const chainId = net.chainId.toString();

  console.log("Network chainId:", chainId);
  console.log("Escrow contract:", ESCROW_ADDRESS);
  console.log("Signer (payer):", payer);
  console.log("EscrowId:", escrowId);

  // Try to find release function name.
  // Most likely: releaseEscrow(bytes32) or release(bytes32).
  let releaseSig: string | null = null;

  const candidates: Array<{ name: string; args: string[] }> = [
    { name: "releaseEscrow", args: ["bytes32"] },
    { name: "release", args: ["bytes32"] },
  ];

  for (const c of candidates) {
    try {
      releaseSig = pickFunctionSig(escrow.interface, c.name, c.args);
      console.log("Using release function:", releaseSig);
      break;
    } catch {}
  }

  if (!releaseSig) {
    console.log("❌ Could not find a release function in ABI.");
    console.log("Search your contract for the exact function name/signature and add it to candidates.");
    process.exit(1);
  }

  const data = escrow.interface.encodeFunctionData(releaseSig, [escrowId]);

  console.log("\n=== TX PAYLOAD (wallet-ready) ===");
  console.log(
    JSON.stringify(
      { chainId, to: ESCROW_ADDRESS, data, value: "0" },
      null,
      2
    )
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

  await tryReadEscrow(escrowRO, escrowId);

  console.log("\n✅ Demo complete (release + read-back).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
