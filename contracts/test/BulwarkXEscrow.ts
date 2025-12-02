import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

const enum EscrowStatus {
  Uninitialized,
  Funded,
  Released,
  Refunded,
  Disputed,
}

describe("BulwarkXEscrow", function () {
  async function deployFixture() {
    const [payer, payee, arbiter] = await ethers.getSigners();
    const Escrow = await ethers.getContractFactory("BulwarkXEscrow");
    const escrow = await Escrow.deploy();
    await escrow.waitForDeployment();

    return { escrow, payer, payee, arbiter };
  }

  async function createFundedEscrow(autoReleaseSeconds = 3600n) {
    const { escrow, payer, payee, arbiter } = await loadFixture(deployFixture);
    const amount = ethers.parseEther("1");

    const tx = await escrow
      .connect(payer)
      .createEscrow(payee.address, arbiter.address, autoReleaseSeconds, {
        value: amount,
      });
    const receipt = await tx.wait();
    const escrowId = (receipt!.logs[0] as any).args.escrowId as string;

    return { escrow, payer, payee, arbiter, amount, escrowId };
  }

  it("create escrow and store data", async function () {
    const { escrow, payer, payee, arbiter, amount, escrowId } =
      await createFundedEscrow();

    const stored = await escrow.escrows(escrowId);
    expect(Number(stored.status)).to.equal(EscrowStatus.Funded);
    expect(stored.amount).to.equal(amount);
    expect(stored.payer).to.equal(payer.address);
    expect(stored.payee).to.equal(payee.address);
    expect(stored.arbiter).to.equal(arbiter.address);
  });

  it("payer can release to payee before autoReleaseAt", async function () {
    const { escrow, payer, payee, arbiter, amount, escrowId } =
      await createFundedEscrow();

    await expect(() =>
      escrow.connect(payer).releaseEscrow(escrowId)
    ).to.changeEtherBalances([escrow, payee], [-amount, amount]);

    const stored = await escrow.escrows(escrowId);
    expect(Number(stored.status)).to.equal(EscrowStatus.Released);
  });

  it("payee can refund payer", async function () {
    const { escrow, payer, payee, arbiter, amount, escrowId } =
      await createFundedEscrow();

    await expect(() =>
      escrow.connect(payee).refundEscrow(escrowId)
    ).to.changeEtherBalances([escrow, payer], [-amount, amount]);

    const stored = await escrow.escrows(escrowId);
    expect(Number(stored.status)).to.equal(EscrowStatus.Refunded);
  });

  it("dispute and arbiter resolution - release", async function () {
    const { escrow, payer, payee, arbiter, amount, escrowId } =
      await createFundedEscrow();

    await escrow.connect(payer).openDispute(escrowId);
    const disputed = await escrow.escrows(escrowId);
    expect(Number(disputed.status)).to.equal(EscrowStatus.Disputed);

    await expect(() =>
      escrow.connect(arbiter).releaseEscrow(escrowId)
    ).to.changeEtherBalances([escrow, payee], [-amount, amount]);

    const stored = await escrow.escrows(escrowId);
    expect(Number(stored.status)).to.equal(EscrowStatus.Released);
  });

  it("dispute and arbiter resolution - refund", async function () {
    const { escrow, payer, payee, arbiter, amount, escrowId } =
      await createFundedEscrow();

    await escrow.connect(payer).openDispute(escrowId);
    const disputed = await escrow.escrows(escrowId);
    expect(Number(disputed.status)).to.equal(EscrowStatus.Disputed);

    await expect(() =>
      escrow.connect(arbiter).refundEscrow(escrowId)
    ).to.changeEtherBalances([escrow, payer], [-amount, amount]);

    const stored = await escrow.escrows(escrowId);
    expect(Number(stored.status)).to.equal(EscrowStatus.Refunded);
  });

  it("payee can auto-release after deadline", async function () {
    const autoReleaseSeconds = 5n;
    const { escrow, payee, amount, escrowId } = await createFundedEscrow(
      autoReleaseSeconds
    );

    await time.increase(autoReleaseSeconds + 1n);

    await expect(() =>
      escrow.connect(payee).releaseEscrow(escrowId)
    ).to.changeEtherBalances([escrow, payee], [-amount, amount]);

    const stored = await escrow.escrows(escrowId);
    expect(Number(stored.status)).to.equal(EscrowStatus.Released);
  });
});
