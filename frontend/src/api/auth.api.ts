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
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', data);
      return response.data;
    } catch (error: any) {
      // Fallback for demo purposes if backend is down
      if (error.code === 'ERR_NETWORK' || !error.response) {
        console.warn('Backend unreachable, using demo login');
        return {
          success: true,
          message: 'Demo login successful',
          token: 'demo-jwt-token-12345',
          user: {
            id: 1,
            name: 'Admin User',
            email: data.email || 'admin@dayflow.com',
            role: 'ADMIN',
            employeeId: data.loginId || 'EMP001',
            companyName: 'Dayflow',
            department: 'Management',
            jobPosition: 'Director',
          }
        };
      }
      throw error;
    }
  },

  signup: async (data: SignupPayload): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/signup', data);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || !error.response) {
        return {
          success: true,
          message: 'Demo signup successful',
          token: 'demo-jwt-token-12345',
          user: { id: 2, ...data, employeeId: 'EMP002' }
        };
      }
      throw error;
    }
  },

  me: async (): Promise<{ success: boolean; user: User }> => {
    try {
      const response = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
      return response.data;
    } catch (error: any) {
      if (localStorage.getItem('dayflow_token') === 'demo-jwt-token-12345') {
        return {
          success: true,
          user: {
            id: 1, name: 'Admin User', email: 'admin@dayflow.com', role: 'ADMIN',
            employeeId: 'EMP001', companyName: 'Dayflow', department: 'Management', jobPosition: 'Director'
          }
        };
      }
      throw error;
    }
  },
};
