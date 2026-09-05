import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

type User = { id: number; name: string; email: string; role: 'USER' | 'MODERATOR' | 'ADMIN'; lang: string };
type Ctx = { user: User | null; token: string | null; login: (email: string, password: string) => Promise<void>; register: (n: string, e: string, p: string) => Promise<any>; logout: () => void; refresh: () => Promise<void> };

const AuthCtx = createContext<Ctx>(null as any);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('gb_token'));

  const refresh = async () => {
    if (!localStorage.getItem('gb_token')) return;
    try { const { data } = await api.get('/auth/me'); setUser(data); } catch { localStorage.removeItem('gb_token'); setToken(null); setUser(null); }
  };
  useEffect(() => { refresh(); }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('gb_token', data.token); setToken(data.token); setUser(data.user);
  };
  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    // contul necesita confirmarea emailului: token vine doar dupa /verify
    if (data.token) {
      localStorage.setItem('gb_token', data.token); setToken(data.token); setUser(data.user);
    }
    return data;
  };
  const logout = () => { localStorage.removeItem('gb_token'); setToken(null); setUser(null); };
  return <AuthCtx.Provider value={{ user, token, login, register, logout, refresh }}>{children}</AuthCtx.Provider>;
}
