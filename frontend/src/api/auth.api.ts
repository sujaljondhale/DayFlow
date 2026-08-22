import { apiClient } from './client';
import type { User } from './index';

export type LoginPayload = {
  email?: string;
  loginId?: string;
  password: string;
};

export type SignupPayload = {
  name: string;
  email: string;
  password: string;
  role: string;
  companyName: string;
  department: string;
  jobPosition: string;
  phone: string;
  address: string;
};

export type AuthResponse = {
  success: boolean;
  message?: string;
  token: string;
  user: User;
};

export const authApi = {
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  signup: async (data: SignupPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  me: async (): Promise<{ success: boolean; user: User }> => {
    const response = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
    return response.data;
  },
};
