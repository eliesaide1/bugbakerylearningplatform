import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Technology } from "@shared/types";

interface TrackValue {
  selected: Technology[];
  ids: Set<string>;
  toggle: (tech: Technology) => void;
  clear: () => void;
  names: string[];
  weeks: number;
  trackName: string;
}

const TrackContext = createContext<TrackValue | null>(null);

export function useTrack(): TrackValue {
  const ctx = useContext(TrackContext);
  if (!ctx) throw new Error("useTrack must be used inside <TrackProvider>");
  return ctx;
}

/** Same naming rules as the original page, driven by the picked chips. */
function nameFor(picked: Technology[]): string {
  if (!picked.length) return "Nothing selected yet";

  const names = new Set(picked.map((t) => t.name));
  const groups = new Set(picked.map((t) => t.group));

  if (names.has("React") && names.has("Node.js") && names.has("MongoDB")) return "MERN full stack track";
  if (names.has("Angular") && names.has(".NET Core")) return "Angular and .NET track";
  if (names.has("RAG") || names.has("LangChain")) return "AI engineering track";
  if (names.has("React Native")) return "Mobile development track";
  if (groups.size === 1 && groups.has("ai")) return "AI engineering track";
  if (groups.size === 1 && groups.has("ops")) return "DevOps and cloud track";
  if (groups.size === 1 && groups.has("front")) return "Front-end track";
  if (groups.size >= 3) return "Custom full-stack track";
  return "Custom track";
}

/**
 * The track a visitor is assembling. Shared so the builder and the enrolment
 * form stay in sync no matter where the CMS placed each of them on the page.
 */
export function TrackProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Technology[]>([]);

  const toggle = useCallback((tech: Technology) => {
    setSelected((current) =>
      current.some((t) => t.id === tech.id) ? current.filter((t) => t.id !== tech.id) : [...current, tech]
    );
  }, []);

  const clear = useCallback(() => setSelected([]), []);

  const value = useMemo<TrackValue>(() => {
    const totalWeight = selected.reduce((sum, t) => sum + (t.weight || 0), 0);
    return {
      selected,
      ids: new Set(selected.map((t) => t.id)),
      toggle,
      clear,
      names: selected.map((t) => t.name),
      weeks: selected.length ? Math.min(20, Math.max(4, Math.round(totalWeight * 0.8))) : 0,
      trackName: nameFor(selected),
    };
  }, [selected, toggle, clear]);

  return <TrackContext.Provider value={value}>{children}</TrackContext.Provider>;
}
