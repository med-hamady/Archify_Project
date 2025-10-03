import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
app.use(helmet());
app.use(cors({ origin: false }));
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info({ port }, 'Backend listening');
});
