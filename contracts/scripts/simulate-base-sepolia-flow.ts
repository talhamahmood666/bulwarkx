import { ethers } from "hardhat";

const ESCROW_ADDRESS = "0xCa97AEAA6055cbA49D8626Ec44eE447c54c43f37";

async function main() {
  const signers = await ethers.getSigners();
  const payer = signers[0];

  if (!payer) {
    throw new Error("No signer available. Make sure DEPLOYER_PRIVATE_KEY is set in .env.");
  }

  // For this on-chain simulation, we just reuse the same address for payee and arbiter.
  // The goal is to exercise create -> release -> refund flows on Base Sepolia.
  const payee = payer;
  const arbiter = payer;

  console.log("Payer:", await payer.getAddress());
  console.log("Payee:", await payee.getAddress());
  console.log("Arbiter:", await arbiter.getAddress());
  console.log("Using escrow contract at:", ESCROW_ADDRESS);

  const escrow = await ethers.getContractAt("BulwarkXEscrow", ESCROW_ADDRESS, payer);

  // 1) CREATE ESCROW (native ETH on Base Sepolia)
  const amount = ethers.parseEther("0.01"); // 0.01 ETH
  const autoReleaseDelay = 60 * 60 * 24; // 24 hours (in seconds)
  const autoReleaseAt = BigInt(Math.floor(Date.now() / 1000) + autoReleaseDelay);

  console.log("\nCreating first escrow...");
  const createTx = await escrow.createEscrow(
    await payee.getAddress(),
    await arbiter.getAddress(),
    autoReleaseAt,
    { value: amount }
  );

  const createReceipt = await createTx.wait();
  console.log("Create tx hash:", createReceipt?.hash);

  // Find the EscrowCreated event to get escrowId
  let escrowId: any;
  if (createReceipt?.logs) {
    for (const log of createReceipt.logs) {
      try {
        const parsed = escrow.interface.parseLog(log);
        if (parsed?.name === "EscrowCreated") {
          escrowId = parsed.args.escrowId;
          break;
        }
      } catch {
        // ignore unrelated logs
      }
    }
  }

  if (!escrowId) {
    throw new Error("Failed to find EscrowCreated event / escrowId");
  }

  console.log("First escrowId:", escrowId.toString());

  // 2) RELEASE ESCROW
  console.log("\nReleasing first escrow to payee...");
  const releaseTx = await escrow.releaseEscrow(escrowId);
  const releaseReceipt = await releaseTx.wait();
  console.log("Release tx hash:", releaseReceipt?.hash);

  // 3) CREATE SECOND ESCROW AND REFUND IT
  console.log("\nCreating second escrow for refund scenario...");
  const createTx2 = await escrow.createEscrow(
    await payee.getAddress(),
    await arbiter.getAddress(),
    autoReleaseAt,
    { value: amount }
  );
  const createReceipt2 = await createTx2.wait();
  console.log("Create2 tx hash:", createReceipt2?.hash);

  let escrowId2: any;
  if (createReceipt2?.logs) {
    for (const log of createReceipt2.logs) {
      try {
        const parsed = escrow.interface.parseLog(log);
        if (parsed?.name === "EscrowCreated") {
          escrowId2 = parsed.args.escrowId;
          break;
        }
      } catch {
        // ignore
      }
    }
  }

  if (!escrowId2) {
    throw new Error("Failed to find second EscrowCreated event / escrowId2");
  }

  console.log("Second escrowId (refund scenario):", escrowId2.toString());

  console.log("\nRefunding second escrow back to payer...");
  const refundTx = await escrow.refundEscrow(escrowId2);
  const refundReceipt = await refundTx.wait();
  console.log("Refund tx hash:", refundReceipt?.hash);

  console.log("\nSimulation complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

