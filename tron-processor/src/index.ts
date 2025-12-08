import express from "express";
import TronWeb from "tronweb";
import { CONFIG } from "./config";

const app = express();
app.use(express.json());

const tronWeb = new TronWeb({
  fullHost: CONFIG.tronNodeUrl,
  privateKey: CONFIG.privateKey
});

app.get("/health", (_req, res) => {
  return res.json({ status: "ok", network: CONFIG.tronNodeUrl });
});

app.post("/escrow/create", async (req, res) => {
  const { payee, arbiter, amountSun, tokenAddress } = req.body || {};

  if (!payee || !arbiter || !amountSun) {
    return res.status(400).json({ error: "payee, arbiter, amountSun required" });
  }

  try {
    // Placeholder Tron transaction; implement contract invocation when ABI is available
    const tx = {
      hash: "0xtron-placeholder",
      tokenAddress: tokenAddress || null
    };

    return res.json({ success: true, txHash: tx.hash });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("tron escrow create error", error);
    return res.status(500).json({ error: error?.message || "failed" });
  }
});

const port = CONFIG.port;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Tron processor listening on ${port}`);
});
