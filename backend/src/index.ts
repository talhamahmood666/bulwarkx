import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import invoicesRouter from "./routes/invoices";
import escrowsRouter from "./routes/escrows";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "bulwarkx-backend" });
});

app.use("/api/invoices", invoicesRouter);
app.use("/api/escrows", escrowsRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`BulwarkX backend listening on port ${port}`);
});
