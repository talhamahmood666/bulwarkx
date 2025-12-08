import { expect } from "chai";
import { ethers } from "hardhat";

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

  it("create escrow and store data", async function () {
    const { escrow, payer, payee, arbiter } = await deployFixture();

    const amount = ethers.parseEther("1");
    const autoReleaseSeconds = 3600;

    const tx = await escrow
      .connect(payer)
      .createEscrow(payee.address, arbiter.address, autoReleaseSeconds, {
        value: amount,
      });
    const receipt = await tx.wait();
    const escrowId = receipt!.logs[0]!.args!.escrowId;

    const stored = await escrow.escrows(escrowId);
    expect(Number(stored.status)).to.equal(EscrowStatus.Funded);
    expect(stored.amount).to.equal(amount);
    expect(stored.payer).to.equal(payer.address);
    expect(stored.payee).to.equal(payee.address);
    expect(stored.arbiter).to.equal(arbiter.address);
  });

  it("payer can release to payee before autoReleaseAt", async function () {
    const { escrow, payer, payee, arbiter } = await deployFixture();
    const amount = ethers.parseEther("1");

    const tx = await escrow
      .connect(payer)
      .createEscrow(payee.address, arbiter.address, 3600, { value: amount });
    const receipt = await tx.wait();
    const escrowId = receipt!.logs[0]!.args!.escrowId;

    await expect(() =>
      escrow.connect(payer).releaseEscrow(escrowId)
    ).to.changeEtherBalances([escrow, payee], [-amount, amount]);

    const stored = await escrow.escrows(escrowId);
    expect(Number(stored.status)).to.equal(EscrowStatus.Released);
  });

  it("payee can refund payer", async function () {
    const { escrow, payer, payee, arbiter } = await deployFixture();
    const amount = ethers.parseEther("1");

    const tx = await escrow
      .connect(payer)
      .createEscrow(payee.address, arbiter.address, 3600, { value: amount });
    const receipt = await tx.wait();
    const escrowId = receipt!.logs[0]!.args!.escrowId;

    await expect(() =>
      escrow.connect(payee).refundEscrow(escrowId)
    ).to.changeEtherBalances([escrow, payer], [-amount, amount]);

    const stored = await escrow.escrows(escrowId);
    expect(Number(stored.status)).to.equal(EscrowStatus.Refunded);
  });

  it("dispute and arbiter resolution - release", async function () {
    const { escrow, payer, payee, arbiter } = await deployFixture();
    const amount = ethers.parseEther("1");

    const tx = await escrow
      .connect(payer)
      .createEscrow(payee.address, arbiter.address, 3600, { value: amount });
    const receipt = await tx.wait();
    const escrowId = receipt!.logs[0]!.args!.escrowId;

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
    const { escrow, payer, payee, arbiter } = await deployFixture();
    const amount = ethers.parseEther("1");

    const tx = await escrow
      .connect(payer)
      .createEscrow(payee.address, arbiter.address, 3600, { value: amount });
    const receipt = await tx.wait();
    const escrowId = receipt!.logs[0]!.args!.escrowId;

    await escrow.connect(payer).openDispute(escrowId);
    const disputed = await escrow.escrows(escrowId);
    expect(Number(disputed.status)).to.equal(EscrowStatus.Disputed);

    await expect(() =>
      escrow.connect(arbiter).refundEscrow(escrowId)
    ).to.changeEtherBalances([escrow, payer], [-amount, amount]);

    const stored = await escrow.escrows(escrowId);
    expect(Number(stored.status)).to.equal(EscrowStatus.Refunded);
  });

  it("supports ERC20 token escrows", async function () {
    const { payer, payee, arbiter } = await deployFixture();
    const Token = await ethers.getContractFactory("MockToken");
    const token = await Token.deploy("Mock USD", "MUSD", ethers.parseUnits("1000", 18));
    await token.waitForDeployment();

    const Escrow = await ethers.getContractFactory("BulwarkXEscrow");
    const escrow = await Escrow.deploy();
    await escrow.waitForDeployment();

    const amount = ethers.parseUnits("50", 18);
    await token.connect(payer).approve(await escrow.getAddress(), amount);

    const tx = await escrow
      .connect(payer)
      .createEscrowToken(
        await token.getAddress(),
        payee.address,
        arbiter.address,
        amount,
        7200
      );

    const receipt = await tx.wait();
    const escrowId = receipt!.logs[0]!.args!.escrowId;

    const stored = await escrow.escrows(escrowId);
    expect(stored.token).to.equal(await token.getAddress());
    expect(stored.amount).to.equal(amount);

    await escrow.connect(payer).releaseEscrow(escrowId);
    const payeeBalance = await token.balanceOf(payee.address);
    expect(payeeBalance).to.equal(amount);
  });
});
