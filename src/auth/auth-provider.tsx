import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PublicUser } from "../../shared/contracts";
import { ApiClientError, apiRequest } from "../lib/api";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiRequest<{ user: PublicUser }>("/api/auth/me")
      .then((response) => {
        if (active) setUser(response.user);
      })
      .catch((error: unknown) => {
        if (
          active &&
          !(error instanceof ApiClientError && error.status === 401)
        ) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await apiRequest<{ user: PublicUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(response.user);
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const response = await apiRequest<{ user: PublicUser }>(
        "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        },
      );
      setUser(response.user);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await apiRequest<void>("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
