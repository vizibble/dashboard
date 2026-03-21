import type { Request } from 'express';

import type { AuthJwtPayload } from './auth.js';

export interface AuthenticatedRequest extends Request {
  user: AuthJwtPayload;
}
