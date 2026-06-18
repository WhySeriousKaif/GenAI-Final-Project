// =========================================================================
// Frontend Constants (single source of truth)
// =========================================================================
// Centralizes values that were previously hardcoded across multiple files,
// most importantly the auth token storage key (used by the API client and the
// auth context). Changing it in one place now updates the whole app.

export const TOKEN_KEY = 'lexicore_token';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
