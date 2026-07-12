import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'Employee' | 'DepartmentHead' | 'AssetManager' | 'Admin';
  departmentId: number | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initializeAuth() {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Validate token with the backend
          const response = await api.get('/auth/me', {
            headers: {
              Authorization: `Bearer ${storedToken}`
            }
          });
          setToken(storedToken);
          setUser(response.data.user);
        } catch (err) {
          console.error('Session validation failed on boot:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    initializeAuth();
  }, []);

  const login = (newToken: string, newAuthUser: AuthUser) => {
    setToken(newToken);
    setUser(newAuthUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newAuthUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout }}>
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
