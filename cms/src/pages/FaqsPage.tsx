import { useState } from "react";
import { Badge, Button, Chevron, EmptyState, TextArea, TextBox } from "@shared/ui";
import { PageHeader } from "../components/Shell";
import { ConfirmButton } from "../components/ConfirmButton";
import { useCreate, useList, useRemove, useReorder, useUpdate } from "../api/queries";
import type { Faq } from "@shared/types";

export default function FaqsPage() {
  const { data: faqs = [], isLoading } = useList("faqs");
  const create = useCreate("faqs");
  const update = useUpdate("faqs");
  const remove = useRemove("faqs");
  const reorder = useReorder("faqs");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  // Keyed by id, so reordering and deleting cannot pop the wrong card open.
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= faqs.length) return;
    const next = [...faqs];
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    reorder.mutate(next.map((f) => f.id));
  };

  const add = () => {
    if (!question.trim() || !answer.trim()) return;
    create.mutate(
      { question: question.trim(), answer: answer.trim(), order: faqs.length, visible: true },
      {
        onSuccess: (faq) => {
          setQuestion("");
          setAnswer("");
          setOpen((current) => new Set(current).add(faq.id));
        },
      }
    );
  };

  const hidden = faqs.filter((f) => !f.visible).length;
  const allOpen = faqs.length > 0 && open.size >= faqs.length;

  return (
    <>
      <PageHeader
        title="Questions"
        description="The FAQ on the public page, in this order. Open a card to edit it."
        badge={hidden ? `${faqs.length} questions · ${hidden} hidden` : `${faqs.length} questions`}
        actions={
          faqs.length > 1 ? (
            <Button
              variant="quiet"
              onClick={() => setOpen(allOpen ? new Set() : new Set(faqs.map((f) => f.id)))}
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </Button>
          ) : null
        }
      />

      <div className="mb-8 border border-line-strong bg-panel p-5">
        <h2 className="mb-4 text-step-1">Add a question</h2>
        <TextBox
          label="Question"
          placeholder="e.g. Do I need my own laptop?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <TextArea label="Answer" rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} />
        <Button onClick={add} disabled={!question.trim() || !answer.trim() || create.isPending}>
          {create.isPending ? "Adding…" : "Add question"}
        </Button>
        {create.isError ? (
          <p className="mt-2 text-[0.9rem] text-danger">{(create.error as Error).message}</p>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : !faqs.length ? (
        <EmptyState title="No questions yet" message="Add one above and it appears on the site." />
      ) : (
        <div className="grid gap-2">
          {faqs.map((faq, index) => (
            <FaqCard
              key={faq.id}
              faq={faq}
              index={index}
              isOpen={open.has(faq.id)}
              first={index === 0}
              last={index === faqs.length - 1}
              busy={reorder.isPending}
              onToggle={() => toggle(faq.id)}
              onUp={() => move(index, -1)}
              onDown={() => move(index, 1)}
              onSave={(patch) => update.mutate({ id: faq.id, ...patch })}
              onDelete={() => remove.mutate(faq.id)}
              saving={update.isPending}
            />
          ))}
        </div>
      )}
    </>
  );
}

function FaqCard({
  faq,
  index,
  isOpen,
  first,
  last,
  busy,
  onToggle,
  onUp,
  onDown,
  onSave,
  onDelete,
  saving,
}: {
  faq: Faq;
  index: number;
  isOpen: boolean;
  first: boolean;
  last: boolean;
  busy: boolean;
  onToggle: () => void;
  onUp: () => void;
  onDown: () => void;
  onSave: (patch: Partial<Faq>) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState({ question: faq.question, answer: faq.answer });
  const dirty = draft.question !== faq.question || draft.answer !== faq.answer;
  const panelId = `faq-panel-${faq.id}`;

  return (
    <div
      className={`border bg-panel transition-colors ${isOpen ? "border-primary" : "border-line-strong"}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="group grid min-w-0 flex-1 cursor-pointer grid-cols-[auto_auto_1fr] items-center gap-x-3 px-4 py-3 text-left"
        >
          <Chevron open={isOpen} className="size-3.5 text-primary" />

          <span className="font-mono text-[0.76rem] tabular-nums text-muted">
            {String(index + 1).padStart(2, "0")}
          </span>

          <span className="min-w-0">
            <span
              className={`block truncate font-semibold group-hover:text-primary ${
                faq.visible ? "" : "text-muted"
              }`}
            >
              {faq.question}
            </span>
            {!isOpen ? (
              <span className="mt-0.5 block truncate text-[0.82rem] text-muted">{faq.answer}</span>
            ) : null}
          </span>
        </button>

        <div className="flex flex-none items-center gap-1.5 pr-3">
          {!faq.visible ? <Badge>hidden</Badge> : null}
          <Button
            variant="quiet"
            size="sm"
            aria-label="Move up"
            disabled={first || busy}
            onClick={onUp}
            className="px-2"
          >
            ↑
          </Button>
          <Button
            variant="quiet"
            size="sm"
            aria-label="Move down"
            disabled={last || busy}
            onClick={onDown}
            className="px-2"
          >
            ↓
          </Button>
          <Button variant="quiet" size="sm" onClick={() => onSave({ visible: !faq.visible })}>
            {faq.visible ? "Hide" : "Show"}
          </Button>
        </div>
      </div>

      {isOpen ? (
        <div id={panelId} className="animate-panel-open border-t border-line px-4 pt-4">
          <TextBox
            label="Question"
            value={draft.question}
            onChange={(e) => setDraft({ ...draft, question: e.target.value })}
          />
          <TextArea
            label="Answer"
            rows={4}
            value={draft.answer}
            onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
          />

          <div className="mb-4 flex flex-wrap gap-2">
            <Button disabled={!dirty || saving} onClick={() => onSave(draft)}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="quiet"
              disabled={!dirty}
              onClick={() => setDraft({ question: faq.question, answer: faq.answer })}
            >
              Discard
            </Button>
            <ConfirmButton label="Delete question" onConfirm={onDelete} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
