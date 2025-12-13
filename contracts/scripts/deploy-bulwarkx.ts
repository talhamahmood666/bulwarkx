import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  try {
    const { PRIVATE_KEY, BASE_SEPOLIA_RPC_URL } = process.env;

    if (!PRIVATE_KEY || !BASE_SEPOLIA_RPC_URL) {
      throw new Error("Missing PRIVATE_KEY or BASE_SEPOLIA_RPC_URL environment variables");
    }

    const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const artifact = await hre.artifacts.readArtifact("BulwarkXEscrow");
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      wallet
    );

    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const network = await provider.getNetwork();
    const balance = await wallet.getBalance();
    const deploymentTx = contract.deploymentTransaction();
    const address = await contract.getAddress();

    console.log("chainId:", network.chainId.toString());
    console.log("deployer address:", wallet.address);
    console.log("deployer balance:", balance.toString());
    console.log("deployment tx hash:", deploymentTx?.hash ?? "");
    console.log("deployed contract address:", address);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

main();
