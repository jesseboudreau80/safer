import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import incidentsRouter from './routes/incidents';
import { authMiddleware } from './middleware/auth';
import { correlationIdMiddleware } from './middleware/correlationId';

export const createApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(correlationIdMiddleware);
  app.use(
    morgan(':method :url :status :res[content-length] - :response-time ms :req[x-correlation-id]', {
      stream: {
        write: (message) => console.log(message.trim()),
      },
    }),
  );

  app.use('/api', authMiddleware);
  app.use('/api/incidents', incidentsRouter);

  const webDir = path.join(__dirname, '..', 'web');
  app.use(express.static(webDir));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  return app;
};
