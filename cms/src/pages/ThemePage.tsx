import { useEffect } from "react";
import { applyTheme, COLOR_TOKENS, FONT_TOKENS, type ThemeTokens } from "@shared/styles";
import { Alert, Badge, Button, ButtonAnchor, TextBox } from "@shared/ui";
import { PageHeader } from "../components/Shell";
import { SaveBar } from "../components/SaveBar";
import { ColorField } from "../components/ColorField";
import { ConfirmButton } from "../components/ConfirmButton";
import { useDraft } from "../hooks/useDraft";
import { useResetTheme, useSaveTheme, useTheme } from "../api/queries";
import { SITE_URL } from "../api/client";
import type { Theme } from "@shared/types";

export default function ThemePage() {
  const { data, isLoading } = useTheme();
  const save = useSaveTheme();
  const reset = useResetTheme();
  const { draft, set, dirty, commit, reset: discard } = useDraft<Theme>(data);

  // Preview live: the CMS repaints itself as you drag the picker.
  useEffect(() => {
    if (draft) applyTheme(draft);
  }, [draft]);

  // Put the saved palette back if the editor navigates away mid-edit.
  useEffect(
    () => () => {
      applyTheme(data);
    },
    [data]
  );

  if (isLoading || !draft) return <p className="text-muted">Loading…</p>;

  const payload = Object.fromEntries(
    [...COLOR_TOKENS, ...FONT_TOKENS, { key: "radius" as const }, { key: "radiusLarge" as const }].map(
      ({ key }) => [key, draft[key]]
    )
  ) as Partial<Theme>;

  return (
    <>
      <PageHeader
        title="Colours & type"
        description="One palette drives both the public site and this CMS. Changes preview here as you make them, and the moment you save, every open browser repaints over the socket — no reload, no deploy."
        badge={dirty ? "Previewing" : "Live"}
        actions={
          <>
            <ButtonAnchor href={SITE_URL} target="_blank" rel="noopener noreferrer" variant="quiet">
              Watch the site ↗
            </ButtonAnchor>
            <ConfirmButton
              label="Reset to defaults"
              onConfirm={() => reset.mutate(undefined, { onSuccess: (fresh) => commit(fresh) })}
            />
          </>
        }
      />

      {dirty ? (
        <Alert tone="info" className="mb-6">
          You are previewing. Nobody else sees these colours until you save.
        </Alert>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <section className="mb-8 border border-line-strong bg-panel px-5 py-2">
            <h2 className="my-3 text-step-1">Colours</h2>
            {COLOR_TOKENS.map(({ key, label, hint }) => (
              <ColorField
                key={key}
                label={label}
                hint={hint}
                value={String(draft[key] ?? "")}
                onChange={(value) => set({ [key]: value } as Partial<ThemeTokens>)}
              />
            ))}
          </section>

          <section className="border border-line-strong bg-panel p-5">
            <h2 className="mb-3 text-step-1">Type & shape</h2>
            {FONT_TOKENS.map(({ key, label }) => (
              <TextBox
                key={key}
                label={label}
                hint="a CSS font stack"
                value={String(draft[key] ?? "")}
                onChange={(e) => set({ [key]: e.target.value } as Partial<ThemeTokens>)}
              />
            ))}
            <TextBox
              label="Corner radius — controls"
              hint="buttons and inputs, e.g. 4px"
              value={draft.radius ?? ""}
              onChange={(e) => set({ radius: e.target.value })}
            />
            <TextBox
              label="Corner radius — cards"
              hint="course cards and panels, e.g. 10px"
              value={draft.radiusLarge ?? ""}
              onChange={(e) => set({ radiusLarge: e.target.value })}
            />
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-3 text-step-1">Preview</h2>
          <div className="border border-line-strong bg-paper p-5">
            <p className="font-display text-[1.6rem] leading-none font-extrabold text-ink">
              Learn to build software
            </p>
            <p className="mt-3 text-ink-2">
              Body copy sits on paper, in the body font, at the body colour.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="secondary">
                Secondary
              </Button>
              <Button size="sm" variant="tertiary">
                Tertiary
              </Button>
              <Button size="sm" variant="ghost">
                Ghost
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="primary">primary</Badge>
              <Badge tone="secondary">secondary</Badge>
              <Badge tone="tertiary">tertiary</Badge>
              <Badge tone="danger">danger</Badge>
              <Badge tone="success">success</Badge>
            </div>

            <div className="mt-5 border border-line-strong bg-panel p-4">
              <p className="font-mono text-[0.78rem] text-muted">Panel on a card</p>
              <p className="mt-1 text-[0.95rem] text-ink-2">Borders use the line colours.</p>
            </div>

            <div className="mt-4 bg-ink p-4 text-on-dark">
              <p className="font-display font-extrabold text-white">Dark band</p>
              <p className="mt-1 text-[0.9rem] text-on-dark-muted">Muted text on dark.</p>
              <input
                readOnly
                value="A form field"
                className="mt-3 w-full rounded-card border border-field-border bg-field px-3 py-2 text-white"
              />
            </div>

            <div className="mt-4 border-l-4 border-secondary bg-secondary-soft px-4 py-3">
              <b className="font-display">Callout</b>
              <p className="text-[0.9rem] text-ink-2">Uses the secondary tint.</p>
            </div>
          </div>
        </aside>
      </div>

      <SaveBar
        dirty={dirty}
        saving={save.isPending}
        error={save.error}
        saved={save.isSuccess}
        onSave={() => save.mutate(payload, { onSuccess: (saved) => commit(saved) })}
        onReset={discard}
        savedMessage="Saved — every open page repainted."
      />
    </>
  );
}
