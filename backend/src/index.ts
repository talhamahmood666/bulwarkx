import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { runMigrations } from "./db/migrate";
import invoicesRouter from "./routes/invoices";
import escrowsRouter from "./routes/escrows";
import { WebSocketServer } from "./services/websocket";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "bulwarkx-backend" });
});

app.use("/api/v1/invoices", invoicesRouter);
app.use("/api/v1/escrows", escrowsRouter);

const port = Number(process.env.PORT) || 4000;
const wsPort = Number(process.env.WS_PORT) || 4001;

async function start() {
  try {
    await runMigrations();
    console.log('Database ready');
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Migration failed', err);
      process.exit(1);
    }
    console.warn('Skipping migrations (dev mode or DB unavailable)');
  }

  const server = app.listen(port, () => {
    console.log(`BulwarkX backend listening on port ${port}`);
  });

  const wss = new WebSocketServer({ port: wsPort });
  wss.start();
  console.log(`WebSocket server on port ${wsPort}`);
}

start().catch(console.error);

const wsServer = { broadcast: (_data: any) => {} };
export { app, wsServer };