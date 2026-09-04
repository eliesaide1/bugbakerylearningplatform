import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, EmptyState, Spinner } from "@shared/ui";
import { useList, useUploadMedia } from "../api/queries";
import { Pagination } from "./Pagination";
import { formatBytes, mediaId, mediaUrl } from "../api/client";
import type { Media, MediaKind, Ref } from "@shared/types";

interface MediaPickerProps {
  label: string;
  value?: Ref<Media>;
  onChange: (id: string | null) => void;
  /** Restrict the library and the file dialog to one kind. */
  kind?: MediaKind;
  folder?: string;
  hint?: string;
}

/**
 * Attaches an image or video to a field: shows what is attached, opens the
 * library to pick something else, and uploads a new file inline.
 */
export function MediaPicker({ label, value, onChange, kind, folder, hint }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const url = mediaUrl(value);
  const current = typeof value === "object" && value ? value : null;

  return (
    <div className="mb-4">
      <p className="mb-1.5 text-[0.9rem] text-ink-2">
        {label}
        {hint ? <span className="ml-1.5 font-normal text-muted">{hint}</span> : null}
      </p>

      <div className="flex flex-wrap items-center gap-4 border border-line-strong bg-panel p-3">
        <Preview url={url} kind={current?.kind ?? kind} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.95rem] font-semibold">
            {current?.originalName || (url ? "Attached" : "Nothing attached")}
          </p>
          <p className="text-[0.85rem] text-muted">
            {current ? `${current.kind} · ${formatBytes(current.size)}` : "Pick from the library or upload"}
          </p>
        </div>

        <div className="flex flex-none gap-2">
          <Button variant="quiet" size="sm" onClick={() => setOpen(true)}>
            {url ? "Change" : "Choose"}
          </Button>
          {url ? (
            <Button variant="quiet" size="sm" onClick={() => onChange(null)}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      {open ? (
        <MediaDialog
          kind={kind}
          folder={folder}
          selectedId={mediaId(value)}
          onClose={() => setOpen(false)}
          onPick={(media) => {
            onChange(media.id);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function Preview({ url, kind }: { url: string | null; kind?: MediaKind }) {
  if (!url) {
    return <div className="size-16 flex-none border border-dashed border-line-strong bg-paper" />;
  }
  if (kind === "video") {
    return <video src={url} className="size-16 flex-none border border-line-strong bg-ink object-contain" muted />;
  }
  return <img src={url} alt="" className="size-16 flex-none border border-line-strong bg-paper object-contain p-1" />;
}

/** Modal library: browse what is uploaded, or add a file without leaving. */
export function MediaDialog({
  kind,
  folder,
  selectedId,
  onClose,
  onPick,
}: {
  kind?: MediaKind;
  folder?: string;
  selectedId?: string | null;
  onClose: () => void;
  onPick: (media: Media) => void;
}) {
  const { data: media = [], isLoading } = useList("media", kind ? { kind } : undefined);
  const upload = useUploadMedia();
  const inputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  const pages = Math.max(1, Math.ceil(media.length / perPage));
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const visible = useMemo(
    () => media.slice((page - 1) * perPage, page * perPage),
    [media, page, perPage]
  );

  const accept = kind === "image" ? "image/*" : kind === "video" ? "video/*" : "image/*,video/*,.pdf";

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return;
    upload.mutate(
      { files: Array.from(files), folder },
      { onSuccess: (created) => created[0] && onPick(created[0]) }
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Media library"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[88vh] w-full max-w-[900px] flex-col border border-line-strong bg-panel">
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-step-2">Media library</h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
              {upload.isPending ? <Spinner /> : null}
              {upload.isPending ? "Uploading…" : "Upload"}
            </Button>
            <Button variant="quiet" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </header>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          hidden
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {upload.isError ? (
            <p className="mb-4 text-[0.9rem] text-danger">{(upload.error as Error).message}</p>
          ) : null}

          {isLoading ? (
            <p className="text-muted">Loading…</p>
          ) : !media.length ? (
            <EmptyState
              title="Nothing uploaded yet"
              message="Upload an image or a video and it becomes available everywhere in the CMS."
              action={<Button onClick={() => inputRef.current?.click()}>Upload a file</Button>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPick(item)}
                  className={`cursor-pointer border p-2 text-left transition-colors ${
                    selectedId === item.id
                      ? "border-primary bg-primary-soft"
                      : "border-line-strong hover:border-primary"
                  }`}
                >
                  {item.kind === "video" ? (
                    <video src={mediaUrl(item) ?? ""} className="aspect-video w-full bg-ink object-contain" muted />
                  ) : (
                    <img
                      src={mediaUrl(item) ?? ""}
                      alt={item.alt}
                      className="aspect-video w-full bg-paper object-contain p-2"
                    />
                  )}
                  <p className="mt-2 truncate text-[0.85rem] font-semibold">{item.originalName}</p>
                  <p className="mt-1 flex items-center gap-2 text-[0.75rem] text-muted">
                    <Badge tone={item.kind === "video" ? "secondary" : "neutral"}>{item.kind}</Badge>
                    {formatBytes(item.size)}
                  </p>
                </button>
              ))}
            </div>
          )}

          {media.length > perPage ? (
            <Pagination
              page={page}
              perPage={perPage}
              total={media.length}
              onPage={setPage}
              onPerPage={(n) => {
                setPerPage(n);
                setPage(1);
              }}
              noun="files"
              perPageOptions={[12, 24, 48]}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
