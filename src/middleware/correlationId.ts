import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const headerId = req.header('x-correlation-id');
  const correlationId = headerId && headerId.trim().length > 0 ? headerId : uuidv4();
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  (req as any).correlationId = correlationId;
  next();
};
