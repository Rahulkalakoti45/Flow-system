import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/services';
import { tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `loading` stays true until we know whether a stored token is still valid,
  // so protected routes don't flash the login screen on refresh.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ user: me }) => setUser(me))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const persistSession = useCallback(({ token, user: nextUser }) => {
    tokenStore.set(token);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (credentials) => persistSession(await authApi.login(credentials)),
    [persistSession]
  );

  const register = useCallback(
    async (details) => persistSession(await authApi.register(details)),
    [persistSession]
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
