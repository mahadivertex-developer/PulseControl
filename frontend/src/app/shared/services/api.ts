import axios from 'axios';
import { authStorage } from './authStorage';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
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
