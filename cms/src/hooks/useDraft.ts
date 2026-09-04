import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * A working copy of a record you are editing.
 *
 * The socket refetches lists whenever anyone saves, so a naive "reset the form
 * whenever the query updates" would throw away your typing mid-sentence. This
 * adopts fresh server data only while you have no unsaved edits, and otherwise
 * raises `remoteChanged` so the screen can offer to reload.
 */
export function useDraft<T extends object>(source: T | undefined) {
  const [draft, setDraft] = useState<T | undefined>(source);
  const [baseline, setBaseline] = useState<T | undefined>(source);
  const [remoteChanged, setRemoteChanged] = useState(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const dirty = useMemo(
    () => Boolean(draft && baseline && JSON.stringify(draft) !== JSON.stringify(baseline)),
    [draft, baseline]
  );
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    if (!source) return;
    if (!draftRef.current || !dirtyRef.current) {
      setDraft(source);
      setBaseline(source);
      setRemoteChanged(false);
    } else if (JSON.stringify(source) !== JSON.stringify(baseline)) {
      setRemoteChanged(true);
    }
    // `baseline` is intentionally not a dependency: comparing against it here
    // decides whether the incoming version differs from what we last adopted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  /** Patch one or more fields on the draft. */
  const set = useCallback(<K extends keyof T>(patch: Pick<T, K> | Partial<T>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }, []);

  /** Field-level setter, convenient for onChange handlers. */
  const field = useCallback(
    <K extends keyof T>(name: K) =>
      (value: T[K]) =>
        setDraft((current) => (current ? { ...current, [name]: value } : current)),
    []
  );

  /** Call after a successful save so the current values become the baseline. */
  const commit = useCallback((saved?: T) => {
    const next = saved ?? draftRef.current;
    if (next) {
      setDraft(next);
      setBaseline(next);
    }
    setRemoteChanged(false);
  }, []);

  const reset = useCallback(() => {
    setDraft(baseline);
    setRemoteChanged(false);
  }, [baseline]);

  const adoptRemote = useCallback((incoming: T) => {
    setDraft(incoming);
    setBaseline(incoming);
    setRemoteChanged(false);
  }, []);

  return { draft, set, field, dirty, remoteChanged, commit, reset, adoptRemote };
}
