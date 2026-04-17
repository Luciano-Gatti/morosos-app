const fallbackApiUrl = 'http://localhost:8081/api/v1';

export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_URL ?? fallbackApiUrl
};
