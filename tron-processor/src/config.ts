import dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
  tronNodeUrl: process.env.TRON_NODE_URL || "https://api.shasta.trongrid.io",
  privateKey: process.env.TRON_PRIVATE_KEY || "",
  escrowContract: process.env.TRON_ESCROW_CONTRACT || "",
  port: Number(process.env.PORT || 4000)
};
