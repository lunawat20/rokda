// ROKDA AUTH CONTEXT & SESSION MANAGER

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../database/supabase';
import { signOut as authSignOut, getLocalSession, saveLocalSession, signInWithDemoUser } from '../services/auth';
import { shouldRequireUnlock } from '../services/biometrics';
import { initializeUserDefaults } from '../database/repository';

interface AuthContextType {
  user: User | any | null;
  session: Session | any | null;
  isLoading: boolean;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  signOut: () => Promise<void>;
  loginWithDemo: () => Promise<void>;
  loginWithCredentials: (u: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isLocked: false,
  setIsLocked: () => {},
  signOut: async () => {},
  loginWithDemo: async () => {},
  loginWithCredentials: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  useEffect(() => {
    async function initAuth() {
      // 1. Check Supabase Remote Session
      try {
        const { data: { session: remoteSession } } = await supabase.auth.getSession();
        if (remoteSession?.user) {
          setSession(remoteSession);
          setUser(remoteSession.user);
          await initializeUserDefaults(remoteSession.user.id);
          const locked = await shouldRequireUnlock();
          setIsLocked(locked);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Supabase session check notice:', e);
      }

      // 2. Check Local Offline Persisted Session
      const localUser = await getLocalSession();
      if (localUser) {
        setUser(localUser);
        setSession({ user: localUser });
        await initializeUserDefaults(localUser.id);
        const locked = await shouldRequireUnlock();
        setIsLocked(locked);
      }
      setIsLoading(false);
    }

    initAuth();

    // 3. Supabase Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        await initializeUserDefaults(session.user.id);
        const locked = await shouldRequireUnlock();
        setIsLocked(locked);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithDemo = async () => {
    setIsLoading(true);
    const res = await signInWithDemoUser();
    setUser(res.user);
    setSession({ user: res.user });
    setIsLoading(false);
  };

  const loginWithCredentials = async (userData: any) => {
    setUser(userData);
    setSession({ user: userData });
    if (userData?.id) {
      await initializeUserDefaults(userData.id);
    }
  };

  const handleSignOut = async () => {
    await authSignOut();
    setSession(null);
    setUser(null);
    setIsLocked(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      isLocked,
      setIsLocked,
      signOut: handleSignOut,
      loginWithDemo,
      loginWithCredentials
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
