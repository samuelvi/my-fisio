import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { isUnauthorizedError } from './utils/httpErrorUtils';

axios.defaults.headers.common.Accept = 'application/ld+json';
axios.defaults.headers.common['Content-Type'] = 'application/ld+json';

export const apiClient = axios.create({
  headers: {
    Accept: 'application/ld+json',
    'Content-Type': 'application/ld+json',
  },
});

function attachAuthFromStorage(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = localStorage.getItem('token');

  if (!token) {
    return config;
  }

  if (typeof config.headers.set === 'function') {
    config.headers.set('Authorization', `Bearer ${token}`);
  } else {
    (config.headers as { Authorization?: string }).Authorization = `Bearer ${token}`;
  }

  return config;
}

apiClient.interceptors.request.use(attachAuthFromStorage);
axios.interceptors.request.use(attachAuthFromStorage);

export function setAuthorizationToken(token: string | null): void {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
  delete axios.defaults.headers.common.Authorization;
}

export function setLocaleHeader(locale: string): void {
  apiClient.defaults.headers.common['X-App-Locale'] = locale;
  axios.defaults.headers.common['X-App-Locale'] = locale;
}

export function installUnauthorizedInterceptor(onUnauthorized: () => void): number {
  return apiClient.interceptors.response.use(
    (response) => {
      const body = response.data as { code?: number } | undefined;
      if (body?.code === 401) {
        onUnauthorized();
        return new Promise(() => undefined);
      }

      return response;
    },
    (error) => {
      if (isUnauthorizedError(error)) {
        onUnauthorized();
        return new Promise(() => undefined);
      }

      return Promise.reject(error);
    },
  );
}
