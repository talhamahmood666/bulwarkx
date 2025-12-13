import { ethers } from "hardhat";

function getPk(name: string): string | null {
  const pk = process.env[name]?.trim();
  if (!pk) return null;
  if (pk.startsWith("0x")) return pk;
  if (pk.length === 64) return "0x" + pk;
  return null;
}

async function getSigner() {
  // Prefer ARBITER_PRIVATE_KEY if set, else PRIVATE_KEY
  const pk = getPk("ARBITER_PRIVATE_KEY") ?? getPk("PRIVATE_KEY");
  if (!pk) return null;
  return new ethers.Wallet(pk, ethers.provider);
}

function pickSig(iface: ethers.Interface, candidates: Array<{ name: string; args: string[] }>) {
  const funcs = iface.fragments.filter((f) => f.type === "function") as ethers.FunctionFragment[];

  for (const c of candidates) {
    for (const fn of funcs) {
      if (fn.name !== c.name) continue;
      const types = fn.inputs.map((i) => i.type);
      if (types.length === c.args.length && types.every((t, i) => t === c.args[i])) return fn.format();
    }
  }

  const names = funcs.map((f) => f.format()).join(" | ");
  throw new Error(`No matching arbiter-refund function found. ABI functions: ${names}`);
}

async function readEscrow(escrowRO: any, escrowId: string) {
  try {
    const e = await escrowRO.escrows(escrowId);
    console.log("\n=== On-chain escrow (escrows mapping) ===");
    console.log({
      payer: e[0],
      payee: e[1],
      arbiter: e[2],
      token: e[3],
      amount: e[4].toString(),
      createdAt: e[5].toString(),
      updatedAt: e[6].toString(),
      status: e[7].toString(),
    });
  } catch {
    console.log("\n⚠️ Could not read escrows mapping.");
  }
}

async function main() {
  const ESCROW_ADDRESS = "0x4092898476761dA6Be8Ef2cD608Ea812D6164b3e";
  const escrowId = (process.env.ESCROW_ID?.trim() || process.argv[2]?.trim() || "").trim();

  if (!escrowId.startsWith("0x") || escrowId.length !== 66) {
    console.log("❌ Provide ESCROW_ID:");
    console.log("ESCROW_ID=0x... npx hardhat run scripts/demo-arbiter-refund.ts --network baseSepolia");
    process.exit(1);
  }

  const signer = await getSigner();
  if (!signer) {
    console.log("❌ No arbiter signer available. Set ARBITER_PRIVATE_KEY or PRIVATE_KEY.");
    process.exit(1);
  }

  const net = await ethers.provider.getNetwork();
  const chainId = net.chainId.toString();
  const from = await signer.getAddress();

  const escrowRO = await ethers.getContractAt("BulwarkXEscrow", ESCROW_ADDRESS);
  const escrow = escrowRO.connect(signer);

  // Try common arbiter refund patterns, including boolean-resolution pattern
  // Pattern A: direct arbiterRefund(bytes32)
  // Pattern B: resolveDispute(bytes32,bool) with false meaning refund payer
  let data: string | null = null;
  let chosen: string | null = null;

  try {
    chosen = pickSig(escrow.interface, [{ name: "arbiterRefund", args: ["bytes32"] }]);
    data = escrow.interface.encodeFunctionData(chosen, [escrowId]);
  } catch {}

  if (!data) {
    try {
      chosen = pickSig(escrow.interface, [{ name: "resolveDispute", args: ["bytes32", "bool"] }]);
      // Convention: false = refund payer, true = release payee
      data = escrow.interface.encodeFunctionData(chosen, [escrowId, false]);
    } catch {}
  }

  if (!data || !chosen) {
    // Last resort candidates
    chosen = pickSig(escrow.interface, [
      { name: "refundByArbiter", args: ["bytes32"] },
      { name: "arbiterResolve", args: ["bytes32", "bool"] },
      { name: "resolve", args: ["bytes32", "bool"] },
    ]);
    if (chosen.includes("(bytes32,bool)")) {
      data = escrow.interface.encodeFunctionData(chosen, [escrowId, false]);
    } else {
      data = escrow.interface.encodeFunctionData(chosen, [escrowId]);
    }
  }

  console.log("Network chainId:", chainId);
  console.log("Escrow contract:", ESCROW_ADDRESS);
  console.log("Arbiter signer:", from);
  console.log("EscrowId:", escrowId);
  console.log("Using function:", chosen);

  console.log("\n=== TX PAYLOAD (wallet-ready) ===");
  console.log(JSON.stringify({ chainId, to: ESCROW_ADDRESS, data, value: "0" }, null, 2));

  const tx = await signer.sendTransaction({ to: ESCROW_ADDRESS, data, value: 0 });
  console.log("\nSubmitted tx:", tx.hash);
  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt?.blockNumber);

  const basescan = "https://sepolia.basescan.org";
  console.log("\nTx:", `${basescan}/tx/${tx.hash}`);

  await readEscrow(escrowRO, escrowId);
  console.log("\n✅ Demo complete (arbiter refund).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
