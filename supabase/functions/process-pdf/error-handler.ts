import { ProcessingError } from './types.ts';

export class ProcessingErrorHandler extends Error {
  code: string;
  phase: string;
  recoverable: boolean;
  details?: any;

  constructor(code: string, message: string, phase: string, recoverable: boolean = false, details?: any) {
    super(message);
    this.code = code;
    this.phase = phase;
    this.recoverable = recoverable;
    this.details = details;
    this.name = 'ProcessingError';
  }

  toJSON(): ProcessingError {
    return {
      code: this.code,
      message: this.message,
      phase: this.phase,
      details: this.details,
      recoverable: this.recoverable,
    };
  }
}

/**
 * Retry logic com exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt + 1}/${maxRetries} failed:`, error.message);

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Determina se um erro é recuperável
 */
export function isRecoverableError(error: any): boolean {
  const recoverableErrors = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'ENOTFOUND',
  ];

  if (error.code && recoverableErrors.includes(error.code)) {
    return true;
  }

  if (error.status && [408, 429, 500, 502, 503, 504].includes(error.status)) {
    return true;
  }

  return false;
}
