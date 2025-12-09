import { expect } from "chai";
import { ethers } from "hardhat";
import { LogDescription } from "ethers";

const enum EscrowStatus {
  Uninitialized,
  Funded,
  Released,
  Refunded,
  Disputed,
}

describe("BulwarkXEscrow (Base-focused)", function () {
  async function deployEscrowFixture() {
    const [payer, payee, arbiter, stranger] = await ethers.getSigners();
    const Escrow = await ethers.getContractFactory("BulwarkXEscrow");
    const escrow = await Escrow.deploy();
    await escrow.waitForDeployment();

    return { escrow, payer, payee, arbiter, stranger };
  }

  async function deployWithTokenFixture() {
    const context = await deployEscrowFixture();
    const Token = await ethers.getContractFactory("MockERC20");
    const token = await Token.deploy(
      "Mock USD",
      "MUSD",
      ethers.parseUnits("1000000", 18)
    );
    await token.waitForDeployment();

    return { ...context, token };
  }

  function findEscrowCreated(receipt: any, escrowInterface: any) {
    const parsedLogs = (receipt?.logs || [])
      .map((log: any) => {
        try {
          return escrowInterface.parseLog(log);
        } catch (err) {
          return null;
        }
      })
      .filter(Boolean) as LogDescription[];

    return parsedLogs.find((log) => log.name === "EscrowCreated");
  }

  it("creates an escrow with native token (Base ETH)", async function () {
    const { escrow, payer, payee, arbiter } = await deployEscrowFixture();
    const amount = ethers.parseEther("1");
    const autoReleaseSeconds = 3600;

    const txPromise = escrow
      .connect(payer)
      .createEscrow(payee.address, arbiter.address, autoReleaseSeconds, {
        value: amount,
      });

    await expect(txPromise).to.changeEtherBalances(
      [payer, escrow],
      [amount * -1n, amount]
    );

    const receipt = await (await txPromise).wait();
    const created = findEscrowCreated(receipt!, escrow.interface);
    const escrowId = created?.args?.escrowId as string;

    expect(escrowId).to.match(/^0x[0-9a-fA-F]{64}$/);

    const stored = await escrow.escrows(escrowId);
    expect(stored.payer).to.equal(payer.address);
    expect(stored.payee).to.equal(payee.address);
    expect(stored.token).to.equal(ethers.ZeroAddress);
    expect(stored.amount).to.equal(amount);
    expect(Number(stored.status)).to.equal(EscrowStatus.Funded);
  });

  it("creates an escrow with ERC20 token (USDT/USDC style)", async function () {
    const { escrow, payer, payee, arbiter, token } = await deployWithTokenFixture();
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
    const created = findEscrowCreated(receipt!, escrow.interface);
    const escrowId = created?.args?.escrowId as string;

    expect(escrowId).to.match(/^0x[0-9a-fA-F]{64}$/);
    expect(await token.balanceOf(await escrow.getAddress())).to.equal(amount);

    const stored = await escrow.escrows(escrowId);
    expect(stored.token).to.equal(await token.getAddress());
    expect(stored.amount).to.equal(amount);
    expect(Number(stored.status)).to.equal(EscrowStatus.Funded);
  });

  it("allows payer to release escrow to payee", async function () {
    const { escrow, payer, payee, arbiter } = await deployEscrowFixture();
    const amount = ethers.parseEther("1");

    const tx = await escrow
      .connect(payer)
      .createEscrow(payee.address, arbiter.address, 3600, { value: amount });
    const receipt = await tx.wait();
    const escrowId = findEscrowCreated(receipt!, escrow.interface)?.args
      ?.escrowId as string;

    await expect(() =>
      escrow.connect(payer).releaseEscrow(escrowId)
    ).to.changeEtherBalances([escrow, payee], [-amount, amount]);

    const stored = await escrow.escrows(escrowId);
    expect(Number(stored.status)).to.equal(EscrowStatus.Released);

    await expect(escrow.connect(payer).releaseEscrow(escrowId)).to.be.revertedWith(
      "cannot release"
    );
  });

  it("allows arbiter to refund payer after dispute", async function () {
    const { escrow, payer, payee, arbiter } = await deployEscrowFixture();
    const amount = ethers.parseEther("2");
    const createTx = await escrow
      .connect(payer)
      .createEscrow(payee.address, arbiter.address, 3600, { value: amount });
    const receipt = await createTx.wait();
    const escrowId = findEscrowCreated(receipt!, escrow.interface)?.args
      ?.escrowId as string;

    await escrow.connect(payer).openDispute(escrowId);

    await expect(() =>
      escrow.connect(arbiter).refundEscrow(escrowId)
    ).to.changeEtherBalances([escrow, payer], [-amount, amount]);

    const stored = await escrow.escrows(escrowId);
    expect(Number(stored.status)).to.equal(EscrowStatus.Refunded);

    await expect(escrow.connect(arbiter).refundEscrow(escrowId)).to.be.revertedWith(
      "cannot refund"
    );
  });

  it("prevents unauthorized addresses from releasing or refunding", async function () {
    const { escrow, payer, payee, arbiter, stranger } = await deployEscrowFixture();
    const amount = ethers.parseEther("0.5");
    const createTx = await escrow
      .connect(payer)
      .createEscrow(payee.address, arbiter.address, 3600, { value: amount });
    const receipt = await createTx.wait();
    const escrowId = findEscrowCreated(receipt!, escrow.interface)?.args
      ?.escrowId as string;

    await expect(escrow.connect(stranger).releaseEscrow(escrowId)).to.be.revertedWith(
      "not authorized"
    );

    await expect(escrow.connect(stranger).refundEscrow(escrowId)).to.be.revertedWith(
      "not authorized"
    );
  });

  it("handles ERC20 release and prevents double release", async function () {
    const { escrow, payer, payee, arbiter, token } = await deployWithTokenFixture();
    const amount = ethers.parseUnits("10", 18);

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
    const escrowId = findEscrowCreated(receipt!, escrow.interface)?.args
      ?.escrowId as string;

    await expect(() =>
      escrow.connect(payer).releaseEscrow(escrowId)
    ).to.changeTokenBalances(
      token,
      [await escrow.getAddress(), payee.address],
      [-amount, amount]
    );

    const stored = await escrow.escrows(escrowId);
    expect(Number(stored.status)).to.equal(EscrowStatus.Released);

    await expect(escrow.connect(payer).releaseEscrow(escrowId)).to.be.revertedWith(
      "cannot release"
    );
  });

  it("reverts on invalid or edge cases", async function () {
    const { escrow, payer, payee, arbiter } = await deployEscrowFixture();

    await expect(
      escrow
        .connect(payer)
        .createEscrow(payee.address, arbiter.address, 3600, { value: 0 })
    ).to.be.revertedWith("amount must be > 0");

    const fakeId = ethers.id("nonexistent");
    await expect(escrow.connect(payer).releaseEscrow(fakeId)).to.be.revertedWith(
      "escrow not found"
    );
    await expect(escrow.connect(payer).refundEscrow(fakeId)).to.be.revertedWith(
      "escrow not found"
    );

    const createTx = await escrow
      .connect(payer)
      .createEscrow(payee.address, arbiter.address, 3600, {
        value: ethers.parseEther("0.1"),
      });
    const receipt = await createTx.wait();
    const escrowId = findEscrowCreated(receipt!, escrow.interface)?.args
      ?.escrowId as string;

    await escrow.connect(payer).releaseEscrow(escrowId);
    await expect(escrow.connect(payer).refundEscrow(escrowId)).to.be.revertedWith(
      "cannot refund"
    );
  });
});
