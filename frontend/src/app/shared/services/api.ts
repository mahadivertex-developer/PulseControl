import axios from 'axios';
import { authStorage } from './authStorage';

function resolveApiUrl(): string {
  const configuredUrl = process.env.REACT_APP_API_URL?.trim();
  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname.endsWith('.app.github.dev')) {
      const backendHost = hostname.replace(/-\d+\.app\.github\.dev$/i, '-3002.app.github.dev');
      return `${protocol}//${backendHost}/api`;
    }
  }

  return 'http://localhost:3002/api';
}

const API_URL = resolveApiUrl();
const API_TIMEOUT = Number(process.env.REACT_APP_API_TIMEOUT || 30000);

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
});

apiClient.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
