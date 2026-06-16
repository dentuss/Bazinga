import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  type Profile,
  type ProfileUpsertRequest,
  createProfile as apiCreateProfile,
  deleteProfile as apiDeleteProfile,
  listProfiles as apiListProfiles,
  updateProfile as apiUpdateProfile,
} from "@/lib/profiles";
import type { SignupPlan } from "@/lib/signup";
import { isPaidSubscription, isTrialExpired } from "@/data/subscriptionPlans";
import { updateAccount as apiUpdateAccount, type UpdateAccountInput } from "@/lib/auth";

type AuthUser = {
  id: number;
  username: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  subscriptionType?: string;
  subscriptionExpiration?: string;
  createdAt?: string;
  updatedAt?: string;
};

type AuthApiResponse = {
  token: string;
  userId: number;
  username: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  subscriptionType?: string;
  subscriptionExpiration?: string;
  createdAt?: string;
  updatedAt?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  profiles: Profile[];
  currentProfile: Profile | null;
  profilesLoading: boolean;
  hasPaidSubscription: boolean;
  trialExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  completeSignup: (
    token: string,
    password: string,
    plan: SignupPlan,
    paymentMethodId?: string | null
  ) => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
  updateAccount: (input: UpdateAccountInput) => Promise<void>;
  consumeSigninToken: (verifyToken: () => Promise<AuthApiResponse>) => Promise<void>;
  logout: () => void;
  refreshProfiles: () => Promise<void>;
  selectProfile: (id: number) => void;
  clearProfile: () => void;
  createProfile: (body: ProfileUpsertRequest) => Promise<Profile>;
  saveProfile: (id: number, body: ProfileUpsertRequest) => Promise<Profile>;
  removeProfile: (id: number) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_PROFILE_KEY = "current_profile_id";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("auth_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [currentProfileId, setCurrentProfileId] = useState<number | null>(() => {
    const raw = sessionStorage.getItem(CURRENT_PROFILE_KEY);
    return raw ? Number(raw) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem("auth_token", token);
    else localStorage.removeItem("auth_token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("auth_user", JSON.stringify(user));
    else localStorage.removeItem("auth_user");
  }, [user]);

  useEffect(() => {
    if (currentProfileId !== null) {
      sessionStorage.setItem(CURRENT_PROFILE_KEY, String(currentProfileId));
    } else {
      sessionStorage.removeItem(CURRENT_PROFILE_KEY);
    }
  }, [currentProfileId]);

  const refreshProfiles = useCallback(async () => {
    if (!token) {
      setProfiles([]);
      return;
    }
    setProfilesLoading(true);
    try {
      const list = await apiListProfiles(token);
      setProfiles(list);
    } finally {
      setProfilesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      void refreshProfiles();
    } else {
      setProfiles([]);
      setCurrentProfileId(null);
    }
  }, [token, refreshProfiles]);

  const currentProfile = useMemo(
    () => profiles.find((p) => p.id === currentProfileId) ?? null,
    [profiles, currentProfileId]
  );

  const handleAuth = (tokenValue: string, payload: AuthApiResponse) => {
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
      phone: payload.phone,
      subscriptionType: payload.subscriptionType,
      subscriptionExpiration: payload.subscriptionExpiration,
      createdAt: payload.createdAt ?? now,
      updatedAt: payload.updatedAt ?? now,
    });
    // Force the "Who's watching?" prompt on a fresh sign-in.
    setCurrentProfileId(null);
  };

  /** Used by /signin/verify after the magic link is exchanged for a JWT. */
  const consumeSigninToken = async (verifyToken: () => Promise<AuthApiResponse>) => {
    const response = await verifyToken();
    handleAuth(response.token, response);
  };

  const updateAccount = async (input: UpdateAccountInput) => {
    if (!token) throw new Error("Not authenticated");
    const response = await apiUpdateAccount(token, input);
    handleAuth(response.token, response);
  };

  const login = async (email: string, password: string) => {
    const response = await apiFetch<AuthApiResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    handleAuth(response.token, response);
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await apiFetch<AuthApiResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    handleAuth(response.token, response);
  };

  const completeSignup = async (
    token: string,
    password: string,
    plan: SignupPlan,
    paymentMethodId?: string | null
  ) => {
    const response = await apiFetch<AuthApiResponse>("/api/auth/signup/complete", {
      method: "POST",
      body: JSON.stringify({ token, password, plan, paymentMethodId }),
    });
    handleAuth(response.token, response);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setProfiles([]);
    setCurrentProfileId(null);
  };

  const selectProfile = (id: number) => setCurrentProfileId(id);
  const clearProfile = () => setCurrentProfileId(null);

  const createProfile = async (body: ProfileUpsertRequest) => {
    if (!token) throw new Error("Not authenticated");
    const created = await apiCreateProfile(token, body);
    setProfiles((prev) => [...prev, created]);
    return created;
  };

  const saveProfile = async (id: number, body: ProfileUpsertRequest) => {
    if (!token) throw new Error("Not authenticated");
    const updated = await apiUpdateProfile(token, id, body);
    setProfiles((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const removeProfile = async (id: number) => {
    if (!token) throw new Error("Not authenticated");
    await apiDeleteProfile(token, id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (currentProfileId === id) setCurrentProfileId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        profiles,
        currentProfile,
        profilesLoading,
        hasPaidSubscription: isPaidSubscription(user?.subscriptionType),
        trialExpired: isTrialExpired(user?.subscriptionType, user?.subscriptionExpiration),
        login,
        register,
        completeSignup,
        updateUser: (updates) => setUser((prev) => (prev ? { ...prev, ...updates } : prev)),
        updateAccount,
        consumeSigninToken,
        logout,
        refreshProfiles,
        selectProfile,
        clearProfile,
        createProfile,
        saveProfile,
        removeProfile,
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
