import type { NextFunction, Request, Response } from 'express';

import { APIError } from '@/utils/apiError.js';
import { ApiResponse } from '@/utils/response.js';
import { getTimestamp } from '@/utils/time.js';

export function globalErrorHandler(
  err: Error | APIError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof APIError) {
    if (err.status === 'fail') {
      return ApiResponse.fail(res, err.message, err.statusCode);
    } else {
      return ApiResponse.error(res, err.message, err.statusCode);
    }
  }

  // Programming or unknown errors
  console.error(`[${getTimestamp()}] UNEXPECTED ERROR:`, err);
  return ApiResponse.error(res, 'Internal server error', 500);
}
