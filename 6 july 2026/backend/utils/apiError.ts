export class APIError extends Error {
  public statusCode: number;
  public status: 'fail' | 'error';

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    // 4xx status codes are 'fail', 5xx are 'error'
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}
