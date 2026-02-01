/**
 * API Client Wrapper
 *
 * This wraps the auto-generated API client with configuration and error handling.
 * DO NOT modify generated files directly - edit this wrapper instead.
 */

// TODO: Uncomment when API client is generated
// import { OpenAPI } from './generated';
// import { config } from '@/lib/config';

// Configure the generated client
// OpenAPI.BASE = config.piController.apiBaseUrl;
// OpenAPI.WITH_CREDENTIALS = true;
// OpenAPI.CREDENTIALS = 'include';

// Add auth token from localStorage
// OpenAPI.TOKEN = async () => {
//   const token = localStorage.getItem('auth_token');
//   return token || '';
// };

// Export all generated services and models
// export * from './generated';

// Custom error handler
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}
