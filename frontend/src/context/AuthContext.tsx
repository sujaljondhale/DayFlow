import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetMeQueryKey, useGetMe } from '@/api';
import type { User } from '@/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(localStorage.getItem('dayflow_token'));
  
  // Only fetch user if we have a token
  const { data, isLoading, error } = useGetMe();

  const user = data?.user || null;
  const isAuthenticated = !!user;

  // Sync token state
  const login = (newToken: string, user: User) => {
    localStorage.setItem('dayflow_token', newToken);
    setToken(newToken);
    // Pre-populate the cache with the user data
    queryClient.setQueryData(getGetMeQueryKey(), { success: true, user });
  };

  const logout = () => {
    localStorage.removeItem('dayflow_token');
    setToken(null);
    queryClient.setQueryData(getGetMeQueryKey(), null);
    queryClient.clear(); // Clear all cached data
    window.location.href = '/login';
  };

  useEffect(() => {
    // If the getMe query failed (e.g. 401), and we had a token, it means it's invalid
    if (error && token) {
      logout();
    }
  }, [error, token]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading: isLoading && !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
