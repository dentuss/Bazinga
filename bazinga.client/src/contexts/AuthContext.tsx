import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type AuthUser = {
  id: number;
  username: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  subscriptionType?: string;
  subscriptionExpiration?: string;
  createdAt?: string;
  updatedAt?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState<AuthContextType["user"]>(() => {
    const saved = localStorage.getItem("auth_user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("auth_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("auth_user");
    }
  }, [user]);

  const handleAuth = (tokenValue: string, payload: any) => {
    const now = new Date().toISOString();
    setToken(tokenValue);
    setUser({
      id: payload.userId,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      avatarUrl: payload.avatarUrl,
      firstName: payload.firstName,
      lastName: payload.lastName,
      dateOfBirth: payload.dateOfBirth,
      subscriptionType: payload.subscriptionType,
      subscriptionExpiration: payload.subscriptionExpiration,
      createdAt: payload.createdAt ?? now,
      updatedAt: payload.updatedAt ?? now,
    });
  };

  const login = async (email: string, password: string) => {
    const response = await apiFetch<any>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    handleAuth(response.token, response);
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await apiFetch<any>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    handleAuth(response.token, response);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        updateUser: (updates) => setUser((prev) => (prev ? { ...prev, ...updates } : prev)),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
