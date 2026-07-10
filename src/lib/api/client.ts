import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/store/authStore';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'https://benefitos-backend.onrender.com';

const DEFAULT_TIMEOUT = 20_000;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 800;

// ---------------------------------------------------------------------------
// Create base Axios instance
// ---------------------------------------------------------------------------

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach auth token
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Exponential backoff retry helper
// ---------------------------------------------------------------------------

function isRetryable(error: any): boolean {
  if (!error.response) return true; // Network error / timeout
  const status = error.response?.status;
  return status === 429 || status === 502 || status === 503 || status === 504;
}

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (attempt > retries || !isRetryable(err)) throw err;
      const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

// ---------------------------------------------------------------------------
// Response interceptor — handle 401
// ---------------------------------------------------------------------------

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Typed helpers — all requests go through withRetry
// ---------------------------------------------------------------------------

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await withRetry(() => apiClient.get<T>(url, config));
  return response.data;
}

export async function post<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await withRetry(() => apiClient.post<T>(url, data, config));
  return response.data;
}

export async function put<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await withRetry(() => apiClient.put<T>(url, data, config));
  return response.data;
}

export async function patch<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await withRetry(() => apiClient.patch<T>(url, data, config));
  return response.data;
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await withRetry(() => apiClient.delete<T>(url, config));
  return response.data;
}

export { BASE_URL };
