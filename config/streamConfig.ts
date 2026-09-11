// Stream Video Configuration
// Your Stream.io API credentials

export const STREAM_API_KEY = '4nhmrz6pc29u';

// Backend endpoint for token generation
import config from './config';

export const STREAM_CONFIG = {
  apiKey: STREAM_API_KEY,
  // Backend endpoint for generating user tokens
  tokenProviderUrl: `${config.baseUrl}/api/stream/token`,
};

/**
 * Stream Video SDK is configured and ready to use.
 * Tokens are generated server-side for security.
 */
