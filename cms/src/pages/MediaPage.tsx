import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, EmptyState, SelectBox, Spinner, TextBox } from "@shared/ui";
import { PageHeader } from "../components/Shell";
import { ConfirmButton } from "../components/ConfirmButton";
import { Pagination } from "../components/Pagination";
import { useList, useRemove, useUpdate, useUploadMedia } from "../api/queries";
import { formatBytes, mediaUrl } from "../api/client";
import type { Media, MediaKind } from "@shared/types";

const KINDS = [
  { value: "", label: "Everything" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "file", label: "Files" },
];

export default function MediaPage() {
  const [kind, setKind] = useState("");
  const [folder, setFolder] = useState("general");
  const { data: media = [], isLoading } = useList("media", kind ? { kind } : undefined);
  const upload = useUploadMedia();
  const remove = useRemove("media");
  const inputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  const pages = Math.max(1, Math.ceil(media.length / perPage));
  // Filtering, uploading or deleting can leave you past the last page.
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);
  useEffect(() => setPage(1), [kind]);

  const visible = useMemo(
    () => media.slice((page - 1) * perPage, page * perPage),
    [media, page, perPage]
  );

  return (
    <>
      <PageHeader
        title="Media library"
        description="Images and videos used across the site. Upload once, then attach the file to a section, a program cover or a lesson."
        badge={`${media.length} files`}
        actions={
          <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? <Spinner /> : null}
            {upload.isPending ? "Uploading…" : "Upload files"}
          </Button>
        }
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*,.pdf"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) {
            upload.mutate({ files: Array.from(e.target.files), folder });
          }
          e.target.value = "";
        }}
      />

      <div className="mb-7 grid gap-x-4 md:grid-cols-[200px_260px] md:items-end">
        <SelectBox label="Show" options={KINDS} value={kind} onChange={(e) => setKind(e.target.value)} />
        <TextBox
          label="Upload into folder"
          hint="groups files on disk"
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
        />
      </div>

      {upload.isError ? (
        <p className="mb-4 text-[0.9rem] text-danger">{(upload.error as Error).message}</p>
      ) : null}

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : !media.length ? (
        <EmptyState
          title="Nothing uploaded yet"
          message="Images up to a few megabytes and videos up to 512MB."
          action={<Button onClick={() => inputRef.current?.click()}>Upload a file</Button>}
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((item) => (
              <MediaCard key={item.id} item={item} onDelete={() => remove.mutate(item.id)} />
            ))}
          </div>

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
        </>
      )}
    </>
  );
}

function MediaCard({ item, onDelete }: { item: Media; onDelete: () => void }) {
  const update = useUpdate("media");
  const [alt, setAlt] = useState(item.alt ?? "");
  const url = mediaUrl(item) ?? "";
  const dirty = alt !== (item.alt ?? "");

  return (
    <figure className="m-0 border border-line-strong bg-panel">
      <Preview url={url} kind={item.kind} />

      <figcaption className="p-3">
        <p className="truncate text-[0.9rem] font-semibold" title={item.originalName}>
          {item.originalName}
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.75rem] text-muted">
          <Badge tone={item.kind === "video" ? "secondary" : "neutral"}>{item.kind}</Badge>
          <span>{formatBytes(item.size)}</span>
          <span className="font-mono">/{item.folder}</span>
        </p>

        <TextBox
          label="Alt text"
          hint="described for screen readers"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          wrapperClassName="mt-3 mb-2"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={!dirty || update.isPending}
            onClick={() => update.mutate({ id: item.id, alt, folder: item.folder })}
          >
            Save
          </Button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-card border-[1.5px] border-line-strong px-3.5 py-2 text-[0.9rem] font-semibold text-ink-2 no-underline hover:border-ink-2"
          >
            Open ↗
          </a>
          <ConfirmButton label="Delete" confirmLabel="Delete for good" onConfirm={onDelete} />
        </div>
      </figcaption>
    </figure>
  );
}

function Preview({ url, kind }: { url: string; kind: MediaKind }) {
  if (kind === "video") {
    return <video src={url} controls preload="metadata" className="aspect-video w-full bg-ink object-contain" />;
  }
  if (kind === "image") {
    return <img src={url} alt="" className="aspect-video w-full bg-paper object-contain p-3" />;
  }
  return (
    <div className="grid aspect-video w-full place-items-center bg-paper font-mono text-[0.8rem] text-muted">
      file
    </div>
  );
}
