// =========================================================================
// API Communications Service (Axios Client)
// =========================================================================
// This file centralizes all network requests made from our React frontend 
// to our Express Node.js backend.
// We configure a default base URL so we don't have to hardcode "http://localhost:5000" 
// in every component, making deployment configurations easier.

import axios from 'axios';
import { TOKEN_KEY, API_BASE_URL } from '../config/constants';

// Create a configured Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to automatically attach JWT token on all outgoing calls
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: on an expired/invalid session (401), clear the stale
// token centrally so the auth context + route guards redirect to login. This
// removes ad-hoc 401 handling from individual components.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

/**
 * Normalizes an Axios error into a user-facing message. Centralizes the
 * repeated `err.response?.data?.message || 'fallback'` pattern.
 */
export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || error?.message || fallback;

/**
 * 1. CONTRACTS ENDPOINTS
 */

// Fetches the registry of uploaded contracts (supports title search filter)
export const getContracts = async (search = '') => {
  const response = await apiClient.get(`/contracts?search=${search}`);
  return response.data;
};

// Fetches a single contract's detailed texts, clauses, and visual graph nodes
export const getContractById = async (id) => {
  const response = await apiClient.get(`/contracts/${id}`);
  return response.data;
};

// Uploads a PDF/DOCX file to the server.
// Must use multipart/form-data because we are sending binary file streams.
export const uploadContract = async (file) => {
  const formData = new FormData();
  formData.append('contract', file); // Maps to Multer's upload.single('contract') name

  const response = await apiClient.post('/contracts/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Deletes a contract and its graph representations
export const deleteContract = async (id) => {
  const response = await apiClient.delete(`/contracts/${id}`);
  return response.data;
};

/**
 * 2. SEARCH ENDPOINTS
 */

// Global search keyword scanning across filenames and clause content
export const globalSearch = async (query) => {
  const response = await apiClient.get(`/contracts/search?q=${query}`);
  return response.data;
};

/**
 * 3. INTERACTIVE CHAT (RAG)
 */

// Submits a question about a contract and returns context and AI response
export const chatWithContract = async (contractId, question) => {
  const response = await apiClient.post(`/chat/${contractId}`, { question });
  return response.data;
};

/**
 * 4. SYSTEM ADMIN UTILITIES
 */

// Queries MongoDB connection, Gemini status, and Neo4j status
export const getSystemStatus = async () => {
  const response = await apiClient.get('/admin/status');
  return response.data;
};

// Wipes all records (MongoDB and Neo4j nodes) to prepare fresh demonstrations
export const resetDatabase = async () => {
  const response = await apiClient.post('/admin/reset-db');
  return response.data;
};

/**
 * 5. USER AUTHENTICATION & PROFILE
 */

// Authenticates user and returns token
export const loginUser = async (username, password) => {
  const response = await apiClient.post('/auth/login', { username, password });
  return response.data;
};

// Registers user
export const registerUser = async (username, email, password, role) => {
  const response = await apiClient.post('/auth/register', { username, email, password, role });
  return response.data;
};

// Gets current user details
export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export default apiClient;
