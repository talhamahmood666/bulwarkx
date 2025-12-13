import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import TronWeb from "tronweb";

dotenv.config();

const {
  TRON_FULL_NODE,
  TRON_SOLIDITY_NODE,
  TRON_EVENT_SERVER,
  TRON_PRIVATE_KEY,
  TRON_ESCROW_CONTRACT,
  PORT
} = process.env;

if (!TRON_FULL_NODE || !TRON_SOLIDITY_NODE || !TRON_EVENT_SERVER || !TRON_PRIVATE_KEY || !TRON_ESCROW_CONTRACT) {
  // eslint-disable-next-line no-console
  console.warn("Tron configuration incomplete, please set TRON_FULL_NODE, TRON_SOLIDITY_NODE, TRON_EVENT_SERVER, TRON_PRIVATE_KEY, TRON_ESCROW_CONTRACT.");
}

const tronWeb = new TronWeb({
  fullHost: TRON_FULL_NODE || "",
  solidityNode: TRON_SOLIDITY_NODE || "",
  eventServer: TRON_EVENT_SERVER || "",
  privateKey: TRON_PRIVATE_KEY || ""
});

const app = express();
app.use(cors());
app.use(express.json());

app.post("/tron/escrow/create", async (req, res) => {
  try {
    const { payee, arbiter, amount, tokenAddress } = req.body || {};
    if (!payee || !arbiter || !amount) {
      return res.status(400).json({ success: false, error: "payee, arbiter, amount are required" });
    }

    if (!TRON_ESCROW_CONTRACT) {
      return res.status(500).json({ success: false, error: "TRON_ESCROW_CONTRACT not configured" });
    }

    const contract = await tronWeb.contract().at(TRON_ESCROW_CONTRACT);

    // TODO: adjust to actual Tron escrow contract interface
    const tx = await contract.createEscrow(
      payee,
      arbiter,
      tokenAddress || "0x0000000000000000000000000000000000000000",
      amount
    ).send();

    return res.json({ success: true, tx });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("tron create escrow error", error);
    return res.status(500).json({ success: false, error: error?.message || "Internal Tron error" });
  }
});

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "BulwarkX Tron Processor" });
});

const port = Number(PORT || 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`BulwarkX Tron Processor running on port ${port}`);
});
