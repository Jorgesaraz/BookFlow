'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'ADMIN';
  addresses?: any[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAdmin: false,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  updateUser: () => {}
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Restaurar sesión al cargar la aplicación verificando el token con GET /api/auth/me
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('bookflow_token');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });

        if (response.data && response.data.user) {
          setUser(response.data.user);
          setToken(storedToken);
        } else {
          localStorage.removeItem('bookflow_token');
          setUser(null);
          setToken(null);
        }
      } catch (error: any) {
        console.warn('[AuthContext] Token inválido o expirado. Limpiando sesión:', error.response?.status);
        localStorage.removeItem('bookflow_token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      localStorage.setItem('bookflow_token', receivedToken);
      setUser(receivedUser);
      setToken(receivedToken);

      // Redirección según rol
      if (receivedUser.role === 'ADMIN') {
        router.push('/admin/kanban');
      } else {
        router.push('/');
      }

      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al iniciar sesión. Inténtalo de nuevo.';
      return { success: false, message };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      localStorage.setItem('bookflow_token', receivedToken);
      setUser(receivedUser);
      setToken(receivedToken);

      // El registro fuerza CLIENT, redirigir a /
      router.push('/');

      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al registrar la cuenta.';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('bookflow_token');
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
