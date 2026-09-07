import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';

export type User = { id: number; name: string; email: string; role: string; lang: string } | null;

type Ctx = {
  user: User;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Store = createContext<Ctx>(null as any);
export const useAuth = () => useContext(Store);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);

  const refresh = async () => {
    const t = await SecureStore.getItemAsync('gb_token');
    if (!t) return;
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      await SecureStore.deleteItemAsync('gb_token');
      setUser(null);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('gb_token', data.token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    if (data.token) {
      await SecureStore.setItemAsync('gb_token', data.token);
      setUser(data.user);
    }
    return data;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('gb_token');
    setUser(null);
  };

  return <Store.Provider value={{ user, login, register, logout, refresh }}>{children}</Store.Provider>;
}
