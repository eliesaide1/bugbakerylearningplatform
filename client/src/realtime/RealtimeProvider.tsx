import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { API_URL, tokenStore } from "../api/client";
import type { ContentChange } from "@shared/types";

interface RealtimeValue {
  connected: boolean;
  lastChange: ContentChange | null;
}

const RealtimeContext = createContext<RealtimeValue>({ connected: false, lastChange: null });

export const useRealtime = () => useContext(RealtimeContext);

/**
 * One socket for the whole app. When the CMS saves anything — copy, an image, a
 * new section, or a colour in the theme — the server pushes content:changed and
 * the cached page is refetched, so visitors see it without reloading.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [lastChange, setLastChange] = useState<ContentChange | null>(null);

  useEffect(() => {
    const socket: Socket = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnectionDelay: 800,
      reconnectionDelayMax: 6000,
      // A signed-in trainee joins a room of their own, so a verdict on their
      // work reaches them and nobody else's browser hears about it.
      auth: { token: tokenStore.get() ?? undefined },
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("content:changed", (payload: ContentChange) => {
      setLastChange(payload);
      // The landing page comes from one endpoint and detail pages are cheap,
      // so a blanket refetch is both correct and fast enough.
      queryClient.invalidateQueries({ queryKey: ["site"] });
      queryClient.invalidateQueries({ queryKey: ["program"] });
      queryClient.invalidateQueries({ queryKey: ["lesson"] });
    });

    socket.on("review:updated", () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [queryClient]);

  const value = useMemo(() => ({ connected, lastChange }), [connected, lastChange]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

const LABELS: Record<string, string> = {
  theme: "Colours updated",
  settings: "Page details updated",
  sections: "A section changed",
  programs: "Programs updated",
  lessons: "Lessons updated",
  faqs: "Questions updated",
  technologies: "Track options updated",
  media: "Media updated",
};

/** Small, self-dismissing confirmation that the page just changed under you. */
export function LiveUpdateToast() {
  const { lastChange } = useRealtime();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastChange) return undefined;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 3200);
    return () => window.clearTimeout(timer);
  }, [lastChange]);

  if (!visible || !lastChange) return null;

  return (
    <div
      role="status"
      className="animate-toast-in fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm text-white shadow-lg"
    >
      <span className="mr-2 inline-block size-2 rounded-full bg-secondary align-middle" />
      {LABELS[lastChange.resource] ?? "Page updated just now"}
    </div>
  );
}
