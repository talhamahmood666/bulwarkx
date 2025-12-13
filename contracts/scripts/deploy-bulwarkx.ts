import "dotenv/config";
import { artifacts } from "hardhat";
import { ethers } from "ethers";

async function main() {
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;
  const pk = process.env.PRIVATE_KEY;

  if (!rpcUrl) throw new Error("Missing BASE_SEPOLIA_RPC_URL env var");
  if (!pk) throw new Error("Missing PRIVATE_KEY env var");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(pk, provider);

  const net = await provider.getNetwork();
  const bal = await provider.getBalance(wallet.address);

  console.log("Network chainId:", net.chainId.toString());
  console.log("Deployer:", wallet.address);
  console.log("Deployer balance (wei):", bal.toString());

  const art = await artifacts.readArtifact("BulwarkXEscrow");
  const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);

  const contract = await factory.deploy();
  const tx = contract.deploymentTransaction();
  console.log("Deploy tx hash:", tx?.hash);

  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log("BulwarkXEscrow deployed to:", addr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
