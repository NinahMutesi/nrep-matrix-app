'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ID, Query } from 'appwrite';
import { account, databases } from '@/lib/appwrite/client';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import type { Profile } from '@/types';

interface AuthState {
  loading: boolean;
  authUser: { $id: string; name: string; email: string } | null;
  profile: Profile | null;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<AuthState['authUser']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.equal('userId', userId),
      Query.limit(1),
    ]);
    setProfile((res.documents[0] as unknown as Profile) ?? null);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const user = await account.get();
      setAuthUser({ $id: user.$id, name: user.name, email: user.email });
      await loadProfile(user.$id);
    } catch {
      setAuthUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      await account.createEmailPasswordSession(email, password);
      await refresh();
    },
    [refresh]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const user = await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);
      await databases.createDocument(DATABASE_ID, COLLECTIONS.PROFILES, user.$id, {
        userId: user.$id,
        name,
        email,
        role: 'viewer',
        status: 'pending',
        sectionSlugs: [],
        createdAt: new Date().toISOString(),
      });
      await refresh();
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await account.deleteSession('current');
    setAuthUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ loading, authUser, profile, refresh, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
