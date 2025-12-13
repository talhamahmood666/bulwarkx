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

  const has4 = escrow.interface.fragments.some(
    (f: any) => f.type === "function" && f.format() === "createEscrowWithId(bytes32,address,address,uint256)"
  );
  const has5 = escrow.interface.fragments.some(
    (f: any) =>
      f.type === "function" && f.format() === "createEscrowWithId(bytes32,address,address,uint256,uint64)"
  );

  let tx;
  if (has4) {
    tx = await escrow["createEscrowWithId(bytes32,address,address,uint256)"](
      orderId,
      payeeAddress,
      arbiterAddress,
      amountWei,
      { value: amountWei }
    );
    console.log("Called 4-arg createEscrowWithId");
  } else if (has5) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expirySeconds = BigInt(nowSeconds + 7 * 24 * 60 * 60);
    tx = await escrow["createEscrowWithId(bytes32,address,address,uint256,uint64)"](
      orderId,
      payeeAddress,
      arbiterAddress,
      amountWei,
      expirySeconds,
      { value: amountWei }
    );
    console.log("Called 5-arg createEscrowWithId with expiry:", expirySeconds.toString());
  } else {
    throw new Error("No matching createEscrowWithId overload found on contract");
  }

  const receipt = await tx.wait();
  console.log("Transaction hash:", receipt?.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
