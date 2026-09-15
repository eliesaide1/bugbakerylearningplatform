import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { Integrity, TrackProtection } from "@shared/types";

const DEFAULTS: TrackProtection = {
  blockCopy: true,
  blockPaste: true,
  deterScreenshots: true,
};

interface ProtectionValue {
  protect: TrackProtection;
  /** Call when the trainee opens a different step; the clock restarts. */
  restart: (stepId: string) => void;
  noteTyped: (characters: number) => void;
  notePaste: (characters: number) => void;
  noteCopy: () => void;
  snapshot: () => Integrity;
}

const ProtectionContext = createContext<ProtectionValue | null>(null);

export function useProtection(): ProtectionValue {
  const ctx = useContext(ProtectionContext);
  if (!ctx)
    throw new Error("useProtection must be used inside <ProtectionProvider>");
  return ctx;
}

const empty = (): Integrity => ({
  pasteAttempts: 0,
  pastedCharacters: 0,
  copyAttempts: 0,
  awayEvents: 0,
  typedCharacters: 0,
  durationMs: 0,
});

/**
 * Two jobs, and the second is the one that lasts.
 *
 * It raises the effort of moving an exercise into a chatbot and the answer back
 * — selection, copy, paste and printing are all refused. None of that is
 * enforcement: anyone can open devtools, disable JavaScript, or photograph the
 * screen with a phone, and no web page can stop them.
 *
 * What survives is the counting. A blocked paste is still an observed paste,
 * and a submission that arrives with a burst of them is evidence a person can
 * weigh. That evidence is what reaches the review queue.
 */
export function ProtectionProvider({
  protect,
  children,
}: {
  protect?: TrackProtection;
  children: ReactNode;
}) {
  const settings = { ...DEFAULTS, ...(protect ?? {}) };
  const counters = useRef<Integrity>(empty());
  const startedAt = useRef(Date.now());

  const restart = useCallback((_stepId: string) => {
    counters.current = empty();
    startedAt.current = Date.now();
  }, []);

  const noteTyped = useCallback((characters: number) => {
    counters.current.typedCharacters += characters;
  }, []);

  const notePaste = useCallback((characters: number) => {
    counters.current.pasteAttempts += 1;
    counters.current.pastedCharacters += characters;
  }, []);

  const noteCopy = useCallback(() => {
    counters.current.copyAttempts += 1;
  }, []);

  const snapshot = useCallback(
    (): Integrity => ({
      ...counters.current,
      durationMs: Date.now() - startedAt.current,
    }),
    [],
  );

  // Leaving the tab mid-answer is worth counting: it is the shape of going to
  // fetch an answer from somewhere else. On its own it proves nothing.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden")
        counters.current.awayEvents += 1;
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  // Blank the exercise while the tab is in the background. It costs a
  // screen-recorder and a second monitor something; it costs a phone camera
  // nothing at all.
  useEffect(() => {
    if (!settings.deterScreenshots) return undefined;

    const root = document.documentElement;
    const apply = () => root.classList.toggle("screen-hidden", document.hidden);
    const hide = () => root.classList.add("screen-hidden");
    const show = () => root.classList.remove("screen-hidden");

    document.addEventListener("visibilitychange", apply);
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);

    return () => {
      document.removeEventListener("visibilitychange", apply);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      show();
    };
  }, [settings.deterScreenshots]);

  const value = useMemo(
    () => ({
      protect: settings,
      restart,
      noteTyped,
      notePaste,
      noteCopy,
      snapshot,
    }),
    // `settings` is rebuilt each render from a stable prop; compare its fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      settings.blockCopy,
      settings.blockPaste,
      settings.deterScreenshots,
      restart,
      noteTyped,
      notePaste,
      noteCopy,
      snapshot,
    ],
  );

  return (
    <ProtectionContext.Provider value={value}>
      {children}
    </ProtectionContext.Provider>
  );
}

/**
 * Wraps the parts of a step worth lifting — the brief, the broken code, the
 * acceptance criteria. Selection and copying are refused, and each attempt is
 * counted.
 */
export function Protected({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { protect, noteCopy } = useProtection();
  if (!protect.blockCopy) return <div className={className}>{children}</div>;

  const refuse = (event: React.SyntheticEvent) => {
    event.preventDefault();
    noteCopy();
  };

  return (
    <div
      className={`select-none ${className}`}
      onCopy={refuse}
      onCut={refuse}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}

/**
 * Handlers for the answer fields. Pasting is refused when the track asks for
 * it, and counted either way — a trainee who pastes their own code from their
 * editor looks the same as one pasting a chatbot's, which is exactly why this
 * flags for review rather than deciding anything.
 */
/**
 * The catch-all, and it has to be a native listener.
 *
 * React's own `onBeforeInput` is a synthetic polyfill that does not carry a
 * real `inputType`, so guarding through it silently does nothing — attach this
 * ref to the form instead and the browser's own `beforeinput` is used, which
 * sees every insertion path including dictation and autofill.
 */
export function useNativeInsertGuard<T extends HTMLElement>() {
  const { protect } = useProtection();
  const blocked = protect.blockPaste;
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !blocked) return undefined;

    const guard = (event: Event) => {
      const type = (event as InputEvent).inputType;
      if (
        type === "insertFromPaste" ||
        type === "insertFromDrop" ||
        type === "insertFromYank"
      ) {
        event.preventDefault();
      }
    };

    node.addEventListener("beforeinput", guard, true);
    return () => node.removeEventListener("beforeinput", guard, true);
  }, [blocked]);

  return ref;
}

export function useAnswerGuards() {
  const { protect, notePaste, noteTyped } = useProtection();
  const blocked = protect.blockPaste;

  /** Read the clipboard for the counter. Never let this decide anything. */
  const measure = (event: React.ClipboardEvent) => {
    try {
      notePaste(event.clipboardData?.getData("text")?.length ?? 0);
    } catch {
      // Some browsers refuse the read outright. The attempt still counts.
      notePaste(0);
    }
  };

  return {
    blocked,
    /**
     * Props for the answer fields. `blocked` is deliberately not in here — it
     * is ours, and spreading it onto a <textarea> would put a junk attribute
     * in the DOM.
     */
    props: {
      onPaste: (event: React.ClipboardEvent) => {
        // Refuse first. Reading the clipboard can throw, and an exception
        // thrown before preventDefault lets the paste through — which is
        // exactly the hole this had.
        if (blocked) event.preventDefault();
        measure(event);
      },

      /**
       * The catch-all. `paste` misses drag-drop, dictation and some
       * autofill paths; beforeinput sees every one of them by inputType.
       */
      onBeforeInput: (event: React.FormEvent<HTMLElement>) => {
        if (!blocked) return;
        const type = (event.nativeEvent as InputEvent).inputType;
        if (
          type === "insertFromPaste" ||
          type === "insertFromDrop" ||
          type === "insertFromYank"
        ) {
          event.preventDefault();
        }
      },

      onDrop: (event: React.DragEvent) => {
        if (blocked) event.preventDefault();
      },

      onDragOver: (event: React.DragEvent) => {
        if (blocked) event.preventDefault();
      },

      onKeyDown: (event: React.KeyboardEvent) => {
        // Belt and braces: stop the shortcut before it becomes a paste event.
        if (
          blocked &&
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "v"
        ) {
          event.preventDefault();
          return;
        }
        // Count real characters only, not arrows and modifiers.
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey)
          noteTyped(1);
      },
    },
  };
}
