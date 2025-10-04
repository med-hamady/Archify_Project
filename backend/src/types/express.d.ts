import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      user?: User;
    }
  }
}

export {};
