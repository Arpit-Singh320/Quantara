import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/services/api';

interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: 'ADMIN' | 'BROKER' | 'VIEWER';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, company?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.getMe();
      if (response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.setToken(token);
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      if (response.data?.token && response.data?.user) {
        localStorage.setItem('auth_token', response.data.token);
        api.setToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.error || 'Login failed' };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (email: string, password: string, name: string, company?: string) => {
    try {
      const response = await api.register(email, password, name, company);
      if (response.data?.token && response.data?.user) {
        localStorage.setItem('auth_token', response.data.token);
        api.setToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.error || 'Registration failed' };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
