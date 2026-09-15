import { Badge, EmptyState, SelectBox } from "@shared/ui";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/Shell";
import { useEnrollments, useList } from "../api/queries";

/** Who is on which track, and how far along. */
export default function TraineesPage() {
  const [params, setParams] = useSearchParams();
  const trackId = params.get("track") ?? "";

  const { data: tracks = [] } = useList("tracks");
  const { data: steps = [] } = useList("steps");
  const { data: rows = [], isLoading } = useEnrollments(trackId ? { track: trackId } : undefined);

  const stepCount = (id: string) => steps.filter((s) => s.track === id && s.visible).length;

  return (
    <>
      <PageHeader
        title="Trainees"
        description="Everyone enrolled on a track. Someone whose last activity was weeks ago is usually stuck rather than gone — the review queue will say which step."
        badge={`${rows.length} enrolled`}
      />

      <div className="mb-6 max-w-[22rem]">
        <SelectBox
          label="Track"
          options={[
            { value: "", label: "All tracks" },
            ...tracks.map((t) => ({ value: t.id, label: t.title })),
          ]}
          value={trackId}
          onChange={(e) => setParams(e.target.value ? { track: e.target.value } : {})}
        />
      </div>

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : !rows.length ? (
        <EmptyState title="Nobody has joined a track yet" />
      ) : (
        <div className="overflow-x-auto border border-line-strong">
          <table className="w-full border-collapse bg-panel text-left">
            <thead>
              <tr className="border-b border-line-strong">
                {["Trainee", "Track", "Progress", "Points", "Last active", ""].map((head) => (
                  <th
                    key={head}
                    className="px-4 py-3 font-mono text-[0.72rem] tracking-wide text-muted uppercase"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const total = Math.max(1, stepCount(row.track));
                const done = row.completed?.length ?? 0;
                const percent = Math.round((done / total) * 100);

                return (
                  <tr key={row.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3">
                      <span className="block font-semibold">{row.traineeInfo?.name}</span>
                      <span className="font-mono text-[0.78rem] text-muted">
                        {row.traineeInfo?.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[0.93rem]">{row.trackInfo?.title}</td>
                    <td className="px-4 py-3">
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full rounded-full bg-secondary"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="mt-1 block font-mono text-[0.74rem] tabular-nums text-muted">
                        {done} / {total}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[0.85rem] tabular-nums">{row.points}</td>
                    <td className="px-4 py-3 font-mono text-[0.8rem] text-muted">
                      {row.lastActivityAt
                        ? new Date(row.lastActivityAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {row.status === "completed" ? (
                        <Badge tone="secondary">finished</Badge>
                      ) : row.status === "paused" ? (
                        <Badge>paused</Badge>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
