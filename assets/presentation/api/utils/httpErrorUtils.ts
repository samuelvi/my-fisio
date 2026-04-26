interface HttpLikeError {
  response?: {
    status?: number;
  } | null;
  code?: string;
  message?: string;
}

const NETWORK_ERROR_CODES = new Set([
  'ERR_NETWORK',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ERR_INTERNET_DISCONNECTED',
]);

export function isUnauthorizedError(error: HttpLikeError): boolean {
  return error.response?.status === 401;
}

export function isNetworkError(error: HttpLikeError): boolean {
  if (!error.response) {
    return true;
  }

  if (error.code && NETWORK_ERROR_CODES.has(error.code)) {
    return true;
  }

  return Boolean(error.message?.toLowerCase().includes('network'));
}
