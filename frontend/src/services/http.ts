import axios from 'axios';
import { appConfig } from './config';

export const http = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json'
  }
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message ?? 'Error inesperado al conectar con la API.';
    return Promise.reject(new Error(message));
  }
);
