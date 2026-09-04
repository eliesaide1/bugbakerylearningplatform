import { Link } from "react-router-dom";
import { Badge, ButtonAnchor } from "@shared/ui";
import { PageHeader } from "../components/Shell";
import { useList } from "../api/queries";
import { useRealtime } from "../realtime/RealtimeProvider";
import { SITE_URL } from "../api/client";
import { hasVideo } from "@shared/media";

function Tile({ to, label, value, note }: { to: string; label: string; value: number | string; note: string }) {
  return (
    <Link
      to={to}
      className="block border border-line-strong bg-panel p-5 no-underline transition-colors hover:border-primary"
    >
      <p className="font-mono text-[0.78rem] text-muted">{label}</p>
      <p className="mt-1.5 font-display text-[2rem] leading-none font-extrabold text-ink">{value}</p>
      <p className="mt-2 text-[0.88rem] text-muted">{note}</p>
    </Link>
  );
}

export default function Dashboard() {
  const sections = useList("sections");
  const programs = useList("programs");
  const lessons = useList("lessons");
  const media = useList("media");
  const leads = useList("leads");
  const { connected, lastChange, newLeads } = useRealtime();

  const freeLessons = (lessons.data ?? []).filter((l) => l.isFree).length;
  const openLeads = (leads.data ?? []).filter((l) => l.status === "new").length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Everything the public site shows is edited here. Saving publishes immediately — visitors with the page open see the change without reloading."
        badge={connected ? "Live" : "Offline"}
        actions={
          <ButtonAnchor href={SITE_URL} target="_blank" rel="noopener noreferrer" variant="quiet">
            Open the site ↗
          </ButtonAnchor>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Tile
          to="/sections"
          label="Page sections"
          value={sections.data?.length ?? "—"}
          note={`${(sections.data ?? []).filter((s) => !s.visible).length} hidden`}
        />
        <Tile
          to="/programs"
          label="Programs"
          value={programs.data?.length ?? "—"}
          note={`${(programs.data ?? []).filter((p) => !p.visible).length} hidden`}
        />
        <Tile
          to="/lessons"
          label="Video lessons"
          value={lessons.data?.length ?? "—"}
          note={`${freeLessons} free · ${(lessons.data ?? []).filter((l) => !hasVideo(l)).length} need a video`}
        />
        <Tile
          to="/media"
          label="Media library"
          value={media.data?.length ?? "—"}
          note={`${(media.data ?? []).filter((m) => m.kind === "video").length} videos`}
        />
        <Tile
          to="/leads"
          label="Requests"
          value={leads.data?.length ?? "—"}
          note={`${openLeads} not contacted yet`}
        />
        <Tile to="/theme" label="Colours & type" value="Theme" note="Change the palette site-wide" />
      </div>

      {newLeads.length ? (
        <section className="mt-9">
          <h2 className="text-step-2">Just arrived</h2>
          <ul className="mt-3 list-none border-t border-line-strong p-0">
            {newLeads.map((lead) => (
              <li key={lead.id} className="flex flex-wrap items-center gap-3 border-b border-line-strong py-3">
                <Badge tone="secondary">new</Badge>
                <span className="font-semibold">{lead.name}</span>
                <span className="text-muted">{lead.program}</span>
                <Link to="/leads" className="ml-auto text-primary underline-offset-4 hover:underline">
                  Open
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {lastChange ? (
        <p className="mt-9 text-[0.88rem] text-muted">
          Last publish: <b>{lastChange.resource}</b> {lastChange.action} at{" "}
          {new Date(lastChange.at).toLocaleTimeString()}
        </p>
      ) : null}
    </>
  );
}
