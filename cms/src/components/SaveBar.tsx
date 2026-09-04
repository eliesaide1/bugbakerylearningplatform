import { Alert, Button, Spinner } from "@shared/ui";
import { ApiError } from "../api/client";

interface SaveBarProps {
  dirty: boolean;
  saving: boolean;
  error?: unknown;
  saved?: boolean;
  onSave: () => void;
  onReset?: () => void;
  savedMessage?: string;
  children?: React.ReactNode;
}

/**
 * Sticks to the bottom of an editor. Says plainly whether there is anything to
 * save, and what went wrong if the save failed.
 */
export function SaveBar({
  dirty,
  saving,
  error,
  saved,
  onSave,
  onReset,
  savedMessage = "Saved — the site updated for everyone.",
  children,
}: SaveBarProps) {
  const message =
    error instanceof ApiError ? error.message : error instanceof Error ? error.message : null;

  return (
    <div className="sticky bottom-0 z-20 mt-8 border-t border-line-strong bg-panel/95 py-4 backdrop-blur">
      {message ? (
        <Alert tone="danger" className="mb-3">
          {message}
          {error instanceof ApiError && error.fields ? (
            <ul className="mt-1.5 list-disc pl-5">
              {Object.entries(error.fields).map(([field, messages]) => (
                <li key={field}>
                  <b>{field}:</b> {messages.join(", ")}
                </li>
              ))}
            </ul>
          ) : null}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onSave} disabled={!dirty || saving}>
          {saving ? <Spinner /> : null}
          {saving ? "Saving…" : "Save changes"}
        </Button>

        {onReset ? (
          <Button variant="quiet" onClick={onReset} disabled={!dirty || saving}>
            Discard
          </Button>
        ) : null}

        {children}

        <span className="text-[0.9rem] text-muted">
          {saving ? "" : dirty ? "Unsaved changes" : saved ? savedMessage : "Everything is saved"}
        </span>
      </div>
    </div>
  );
}
