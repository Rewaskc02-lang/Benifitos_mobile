import {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  default as axios,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/authStore';
import { useNetworkStore } from '@/store/networkStore';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("FATAL CONFIG ERROR: EXPO_PUBLIC_API_BASE_URL environment variable is missing.");
}

const DEFAULT_TIMEOUT = 15_000; // 15 seconds

// ---------------------------------------------------------------------------
// Create the base Axios instance
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
// Response interceptor — handle global errors (401, 5xx, etc.)
// ---------------------------------------------------------------------------

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      // Token expired — log the user out
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Helper wrappers with typed responses
// ---------------------------------------------------------------------------

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { setIsOffline } = useNetworkStore.getState();
  try {
    const response = await apiClient.get<T>(url, config);
    const cacheKey = `@cache:${url}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data)).catch(err => {
      console.warn('[Offline Cache] Failed to write cache:', err);
    });
    setIsOffline(false);
    return response.data;
  } catch (error: any) {
    const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.message.includes('Network Error');
    if (isNetworkError) {
      setIsOffline(true);
      const cacheKey = `@cache:${url}`;
      const cached = await AsyncStorage.getItem(cacheKey).catch(() => null);
      if (cached) {
        console.log(`[Offline Cache] Serving cached data for GET: ${url}`);
        const parsed = JSON.parse(cached);
        if (typeof parsed === 'object' && parsed !== null) {
          parsed._isOfflineCached = true;
        }
        return parsed as T;
      }
    }
    throw error;
  }
}

export async function post<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const { setIsOffline } = useNetworkStore.getState();
  try {
    const response = await apiClient.post<T, AxiosResponse<T>, D>(url, data, config);
    setIsOffline(false);
    return response.data;
  } catch (error: any) {
    const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.message.includes('Network Error');
    if (isNetworkError) {
      setIsOffline(true);
    }
    throw error;
  }
}

export async function put<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const { setIsOffline } = useNetworkStore.getState();
  try {
    const response = await apiClient.put<T, AxiosResponse<T>, D>(url, data, config);
    setIsOffline(false);
    return response.data;
  } catch (error: any) {
    const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.message.includes('Network Error');
    if (isNetworkError) {
      setIsOffline(true);
    }
    throw error;
  }
}

export async function patch<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const { setIsOffline } = useNetworkStore.getState();
  try {
    const response = await apiClient.patch<T, AxiosResponse<T>, D>(url, data, config);
    setIsOffline(false);
    return response.data;
  } catch (error: any) {
    const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.message.includes('Network Error');
    if (isNetworkError) {
      setIsOffline(true);
    }
    throw error;
  }
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { setIsOffline } = useNetworkStore.getState();
  try {
    const response = await apiClient.delete<T>(url, config);
    setIsOffline(false);
    return response.data;
  } catch (error: any) {
    const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.message.includes('Network Error');
    if (isNetworkError) {
      setIsOffline(true);
    }
    throw error;
  }
}
