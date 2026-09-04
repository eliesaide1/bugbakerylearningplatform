import { useState } from "react";
import { Badge, Button, EmptyState, SelectBox, TextArea } from "@shared/ui";
import { PageHeader } from "../components/Shell";
import { ConfirmButton } from "../components/ConfirmButton";
import { useList, useRemove, useUpdateLead } from "../api/queries";
import { useRealtime } from "../realtime/RealtimeProvider";
import type { Lead, LeadStatus } from "@shared/types";

const STATUSES: Array<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "enrolled", label: "Enrolled" },
  { value: "closed", label: "Closed" },
];

const TONE: Record<LeadStatus, "secondary" | "primary" | "success" | "neutral"> = {
  new: "secondary",
  contacted: "primary",
  enrolled: "success",
  closed: "neutral",
};

export default function LeadsPage() {
  const [status, setStatus] = useState("");
  const { data: leads = [], isLoading } = useList("leads", status ? { status } : undefined);
  const remove = useRemove("leads");
  const { connected } = useRealtime();

  return (
    <>
      <PageHeader
        title="Requests"
        description="Enrolment and custom-track requests from the site. New ones arrive here live."
        badge={connected ? `${leads.length} · live` : `${leads.length}`}
      />

      <div className="mb-6 max-w-[240px]">
        <SelectBox
          label="Filter"
          options={[{ value: "", label: "All requests" }, ...STATUSES]}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : !leads.length ? (
        <EmptyState title="No requests yet" message="They appear here the moment someone sends the form." />
      ) : (
        <div className="grid gap-4">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onDelete={() => remove.mutate(lead.id)} />
          ))}
        </div>
      )}
    </>
  );
}

function LeadCard({ lead, onDelete }: { lead: Lead; onDelete: () => void }) {
  const update = useUpdateLead();
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [open, setOpen] = useState(false);

  return (
    <article className="border border-line-strong bg-panel p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-display text-[1.15rem] font-extrabold">{lead.name}</h2>
            <Badge tone={TONE[lead.status]}>{lead.status}</Badge>
            {lead.source === "builder" ? <Badge tone="tertiary">custom track</Badge> : null}
          </div>
          <p className="mt-1 text-[0.9rem] text-muted">
            {new Date(lead.createdAt).toLocaleString()} · {lead.program} · {lead.format}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {lead.email ? (
            <a
              href={`mailto:${lead.email}?subject=${encodeURIComponent(`Your training request — ${lead.program}`)}`}
              className="inline-flex items-center rounded-card border-[1.5px] border-primary bg-primary px-3.5 py-2 text-[0.9rem] font-semibold text-white no-underline hover:bg-primary-deep"
            >
              Reply by email
            </a>
          ) : null}
          <Button variant="quiet" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? "Close" : "Details"}
          </Button>
        </div>
      </header>

      <dl className="mt-4 grid gap-x-6 gap-y-1 sm:grid-cols-2">
        <Row label="Email" value={lead.email} />
        <Row label="Phone" value={lead.phone} />
        {lead.technologies?.length ? <Row label="Wants" value={lead.technologies.join(", ")} /> : null}
        {lead.estimatedWeeks ? <Row label="Estimated" value={`${lead.estimatedWeeks} weeks`} /> : null}
      </dl>

      {lead.message ? (
        <p className="mt-4 border-l-4 border-line-strong pl-4 text-ink-2">{lead.message}</p>
      ) : null}

      {open ? (
        <div className="animate-panel-open mt-5 border-t border-line pt-4">
          <div className="max-w-[240px]">
            <SelectBox
              label="Status"
              options={STATUSES}
              value={lead.status}
              onChange={(e) => update.mutate({ id: lead.id, status: e.target.value })}
            />
          </div>

          <TextArea
            label="Private notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={notes === (lead.notes ?? "") || update.isPending}
              onClick={() => update.mutate({ id: lead.id, notes })}
            >
              Save notes
            </Button>
            <ConfirmButton label="Delete request" onConfirm={onDelete} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-[0.92rem]">
      <dt className="text-muted">{label}:</dt>
      <dd className="m-0 font-semibold">{value}</dd>
    </div>
  );
}
