export const ErrorCodes = {
  // Auth Errors
  MISSING_CREDENTIALS: 'Please enter both your email and password.',
  INVALID_CREDENTIALS: 'The email or password you entered is incorrect.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',

  // Device Errors
  DEVICE_NOT_FOUND: "We couldn't find the requested device.",
  UNAUTHORIZED_DEVICE_ACCESS:
    'You do not have permission to access this device.',

  // Generic
  INTERNAL_ERROR: 'Something went wrong on our end. Please try again later.',
  VALIDATION_ERROR:
    'Some information provided is incorrect. Please check and try again.',
} as const;

export type ErrorCode = keyof typeof ErrorCodes;
