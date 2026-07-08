import { get, post, put } from '@/lib/api/client';
import { User } from '@/store/authStore';

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  age?: string;
  income?: string;
  state?: string;
};

export type AuthResponse = {
  user: User;
  token: string;
  refreshToken: string;
};

export const authService = {
  /** Log in with email & password. Returns user and tokens. */
  login: (payload: LoginPayload) =>
    post<AuthResponse, LoginPayload>('/api/auth/login', payload),

  /** Register a new account. Returns user and tokens immediately (auto-login). */
  register: (payload: RegisterPayload) =>
    post<AuthResponse, RegisterPayload>('/api/auth/register', payload),

  /** Fetch the current authenticated user's profile. */
  getMe: () => get<User>('/api/auth/me'),

  /** Update the logged-in user's profile attributes. */
  updateProfile: (profile: Partial<User>) =>
    put<User, Partial<User>>('/api/auth/me', profile),

  /** Change password — requires old password to verify identity. */
  changePassword: (oldPassword: string, newPassword: string) =>
    put<{ success: boolean }, { oldPassword: string; newPassword: string }>(
      '/api/auth/password',
      { oldPassword, newPassword }
    ),

  /** Log out the current session on the server. */
  logout: () => post<void>('/api/auth/logout'),
};
