/**
 * API Configuration — single monolith backend.
 * All requests go to VITE_API_BASE_URL (default: http://localhost:3001/api).
 */

export const apiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
};

/**
 * Build a full URL for a given path.
 * @param {string} path - e.g. '/auth/login'
 */
export function apiUrl(path) {
  return `${apiConfig.baseURL}${path}`;
}
