const apiBaseUrl = process.env.BUN_PUBLIC_API_URL;
if (!apiBaseUrl) {
  throw new Error('The API URL is not configured.');
}

export const API_BASE_URL = apiBaseUrl;
