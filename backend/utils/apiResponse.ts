import type { Response } from 'express';

export class ApiResponse {
  // 200 OK
  static success<T>(
    res: Response,
    data: T,
    statusCode = 200,
    message?: string
  ) {
    return res.status(statusCode).json({
      status: 'success',
      data,
      message,
    });
  }

  // 400s Client Errors
  static fail(res: Response, message: string, statusCode = 400) {
    return res.status(statusCode).json({
      status: 'fail',
      message,
    });
  }

  // 500s Server Errors
  static error(
    res: Response,
    message = 'Internal Server Error',
    statusCode = 500
  ) {
    return res.status(statusCode).json({
      status: 'error',
      message,
    });
  }
}
