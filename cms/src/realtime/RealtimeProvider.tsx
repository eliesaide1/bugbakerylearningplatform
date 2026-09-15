import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import type { ContentChange, Lead, PresencePayload } from "@shared/types";

interface RealtimeValue {
  connected: boolean;
  editors: PresencePayload["editors"];
  lastChange: ContentChange | null;
  newLeads: Lead[];
  dismissLead: (id: string) => void;
}

const RealtimeContext = createContext<RealtimeValue>({
  connected: false,
  editors: [],
  lastChange: null,
  newLeads: [],
  dismissLead: () => {},
});

export const useRealtime = () => useContext(RealtimeContext);

/**
 * The CMS joins the authenticated "cms" room, so it gets content changes made
 * by other editors plus presence and incoming enrolment requests.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const [editors, setEditors] = useState<PresencePayload["editors"]>([]);
  const [lastChange, setLastChange] = useState<ContentChange | null>(null);
  const [newLeads, setNewLeads] = useState<Lead[]>([]);

  useEffect(() => {
    if (!token) {
      setConnected(false);
      setEditors([]);
      return undefined;
    }

    const socket: Socket = io(API_URL, {
      transports: ["websocket", "polling"],
      auth: { token, room: "cms" },
      reconnectionDelay: 800,
      reconnectionDelayMax: 6000,
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("cms:presence", (payload: PresencePayload) => setEditors(payload.editors));

    socket.on("content:changed", (payload: ContentChange) => {
      setLastChange(payload);
      // Someone else saved. Refresh whatever list that was, plus the singletons.
      queryClient.invalidateQueries({ queryKey: ["admin", payload.resource] });
      if (payload.resource === "settings") {
        queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      }
      if (payload.resource === "theme") {
        queryClient.invalidateQueries({ queryKey: ["admin", "theme"] });
      }
    });

    socket.on("lead:new", (lead: Lead) => {
      setNewLeads((current) => [lead, ...current].slice(0, 5));
      queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
    });

    socket.on("lead:updated", () => queryClient.invalidateQueries({ queryKey: ["admin", "leads"] }));

    const bookings = () => queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
    socket.on("booking:new", bookings);
    socket.on("booking:updated", bookings);
    socket.on("booking:deleted", bookings);
    socket.on("lead:deleted", () => queryClient.invalidateQueries({ queryKey: ["admin", "leads"] }));

    // The review queue fills as trainees submit. Keeping the count live means
    // you can leave this open and see work arrive rather than polling for it.
    const submissions = () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "submissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "enrollments"] });
    };
    socket.on("submission:new", submissions);
    socket.on("submission:reviewed", submissions);
    socket.on("enrollment:new", submissions);
    socket.on("track:completed", submissions);

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [token, queryClient]);

  const value = useMemo(
    () => ({
      connected,
      editors,
      lastChange,
      newLeads,
      dismissLead: (id: string) => setNewLeads((current) => current.filter((l) => l.id !== id)),
    }),
    [connected, editors, lastChange, newLeads]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
