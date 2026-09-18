import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, setUnauthorizedHandler, tokenStore } from "../api/client";
import type { AuthResponse, User } from "@shared/types";

interface TraineeValue {
  trainee: User | null;
  token: string | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  join: (name: string, email: string, password: string) => Promise<void>;
  /** Rename yourself. The API returns a fresh token, since it carries the name. */
  rename: (name: string) => Promise<void>;
  signOut: () => void;
}

const TraineeContext = createContext<TraineeValue | null>(null);

export function useTrainee(): TraineeValue {
  const ctx = useContext(TraineeContext);
  if (!ctx) throw new Error("useTrainee must be used inside <TraineeProvider>");
  return ctx;
}

/**
 * The trainee's session on the public site. Deliberately separate from the CMS
 * session: a visitor signing in to do exercises is not signing in to edit the
 * site, and the two tokens should never be confused for one another.
 */
export function TraineeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [trainee, setTrainee] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => tokenStore.get());
  const [ready, setReady] = useState(false);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setTrainee(null);
    // Enrolments and submissions are per-person; none of it may survive.
    queryClient.removeQueries({ queryKey: ["me"] });
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokenStore.clear();
      setToken(null);
      setTrainee(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Restore the session on a reload.
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setReady(true);
      return () => {
        cancelled = true;
      };
    }

    api<{ user: User }>("/auth/me")
      .then((res) => {
        if (!cancelled) setTrainee(res.user);
      })
      .catch(() => {
        if (!cancelled) {
          tokenStore.clear();
          setToken(null);
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const adopt = useCallback((res: AuthResponse) => {
    tokenStore.set(res.token);
    setToken(res.token);
    setTrainee(res.user);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      adopt(await api<AuthResponse>("/auth/login", { method: "POST", body: { email, password } }));
    },
    [adopt]
  );

  const join = useCallback(
    async (name: string, email: string, password: string) => {
      adopt(
        await api<AuthResponse>("/trainee/register", {
          method: "POST",
          body: { name, email, password },
        })
      );
    },
    [adopt]
  );

  const rename = useCallback(
    async (newName: string) => {
      adopt(await api<AuthResponse>("/auth/me", { method: "PATCH", body: { name: newName } }));
    },
    [adopt]
  );

  const value = useMemo(
    () => ({ trainee, token, ready, signIn, join, rename, signOut }),
    [trainee, token, ready, signIn, join, rename, signOut]
  );

  return <TraineeContext.Provider value={value}>{children}</TraineeContext.Provider>;
}
