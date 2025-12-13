import { ethers } from "hardhat";

const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS || "";

async function main() {
  if (!ESCROW_ADDRESS) {
    throw new Error("ESCROW_ADDRESS env var is required");
  }

  const [payer, payee, arbiter] = await ethers.getSigners();
  const payerAddress = await payer.getAddress();
  const payeeAddress = payee ? await payee.getAddress() : payerAddress;
  const arbiterAddress = arbiter ? await arbiter.getAddress() : payerAddress;

  const escrow: any = await ethers.getContractAt("BulwarkXEscrow", ESCROW_ADDRESS, payer);

  const amountWei = ethers.parseEther("0.01");
  const nonce = await escrow.nonces(payerAddress);
  const orderId = ethers.id(`demo-order-${Date.now()}`);

  // escrowId hash uses orderId, payer, payee, token (zero for native), amount, and nonce.
  const escrowId = ethers.solidityPackedKeccak256(
    ["bytes32", "address", "address", "address", "uint256", "uint256"],
    [orderId, payerAddress, payeeAddress, ethers.ZeroAddress, amountWei, nonce]
  );

  console.log("Payer:", payerAddress);
  console.log("Payee:", payeeAddress);
  console.log("Arbiter:", arbiterAddress);
  console.log("Escrow contract:", ESCROW_ADDRESS);
  console.log("Order ID:", orderId);
  console.log("Escrow ID (derived):", escrowId);
  console.log("Nonce:", nonce.toString());
  console.log("Amount (wei):", amountWei.toString());

  const sig4 = "createEscrowWithId(bytes32,address,address,uint256)";
  const sig5 = "createEscrowWithId(bytes32,address,address,uint256,uint64)";

  let selectedSig: string;
  try {
    escrow.interface.getFunction(sig4);
    selectedSig = sig4;
  } catch {
    try {
      escrow.interface.getFunction(sig5);
      selectedSig = sig5;
    } catch {
      throw new Error("No matching createEscrowWithId overload found on contract");
    }
  }

  const args = [orderId, payeeAddress, arbiterAddress, amountWei] as const;
  let finalArgs: (typeof args[number] | bigint)[] = [...args];

  if (selectedSig === sig5) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expirySeconds = BigInt(nowSeconds + 7 * 24 * 60 * 60);
    const maxUint64 = (1n << 64n) - 1n;
    if (expirySeconds > maxUint64) {
      throw new Error("Computed expiry exceeds uint64 range");
    }
    finalArgs = [...args, expirySeconds];
    console.log("Using 5-arg createEscrowWithId with expiry:", expirySeconds.toString());
  } else {
    console.log("Using 4-arg createEscrowWithId");
  }

  const data = escrow.interface.encodeFunctionData(selectedSig, finalArgs);

  const tx1 = await payer.sendTransaction({
    to: ESCROW_ADDRESS,
    data,
    value: amountWei,
  });

  console.log("Transaction hash:", tx1.hash);
  await tx1.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
