import express from 'express';
import cors from 'cors';
import { CONFIG } from './config';
import createRouter from './routes/create';
import releaseRouter from './routes/release';
import refundRouter from './routes/refund';
import statusRouter from './routes/status';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/escrow/create', createRouter);
app.use('/escrow/release', releaseRouter);
app.use('/escrow/refund', refundRouter);
app.use('/escrow/status', statusRouter);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'BulwarkX Processor' });
});

app.listen(CONFIG.port, () => {
  // eslint-disable-next-line no-console
  console.log(`BulwarkX Processor running on port ${CONFIG.port}`);
});
