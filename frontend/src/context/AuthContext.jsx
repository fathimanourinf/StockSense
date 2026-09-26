import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setAuthToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Token kept in memory only (not localStorage) — cleared on refresh by
  // design; simplest secure default for a project like this.
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No persisted session on refresh — just stop the initial spinner.
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post("/auth/login", { email, password });
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const signup = useCallback(async (payload) => {
    const data = await api.post("/auth/signup", payload);
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
