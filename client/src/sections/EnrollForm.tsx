import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useSubmitLead } from "../api/queries";
import { ApiError } from "../api/client";
import { useTrack } from "../state/TrackContext";
import { Reveal } from "../components/Reveal";
import {
  Button,
  ChatGlyph,
  Container,
  MailGlyph,
  ProfileGlyph,
  SelectBox,
  TextArea,
  TextBox,
} from "@shared/ui";
import type { Program, SiteSettings } from "@shared/types";

const FORMATS = ["Group program", "1:1", "Not sure yet"];
const CUSTOM = "A custom combination";

interface EnrollFormProps {
  settings?: SiteSettings;
  programs: Program[];
}

export function EnrollForm({ settings, programs }: EnrollFormProps) {
  const { selected, names, weeks, clear } = useTrack();
  const submit = useSubmitLead();

  const options = [...programs.map((p) => p.title), CUSTOM];

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    program: "",
    format: FORMATS[0],
    message: "",
  });

  // Picking chips in the builder switches this to the custom option.
  useEffect(() => {
    if (selected.length) setForm((f) => ({ ...f, program: CUSTOM }));
  }, [selected.length]);

  const fieldErrors = submit.error instanceof ApiError ? submit.error.fields : null;
  const errorFor = (field: string) => fieldErrors?.[field]?.[0];

  const set =
    (key: keyof typeof form) =>
    (event: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [key]: event.target.value }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        program: form.program || options[0],
        format: form.format,
        message: form.message.trim() || undefined,
        technologies: names.length ? names : undefined,
        estimatedWeeks: weeks || undefined,
        source: selected.length ? "builder" : "enroll",
      },
      {
        onSuccess: () => {
          setForm({ name: "", email: "", phone: "", program: "", format: FORMATS[0], message: "" });
          clear();
        },
      }
    );
  };

  return (
    <section id="enroll" className="scroll-mt-20 bg-ink py-16 text-on-dark md:py-22">
      <Container className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <h2 className="mb-3.5 text-step-3 text-white">{settings?.enrollTitle}</h2>
          <p className="max-w-[62ch] text-step-1 leading-[1.5] text-on-dark-muted">{settings?.enrollLede}</p>

          {selected.length ? (
            <div className="mt-6 border border-border-dark bg-surface-dark p-4">
              <p className="font-mono text-[0.8rem] text-secondary">Your track</p>
              <p className="mt-1.5 text-[0.95rem] text-on-dark-muted">
                {names.join(", ")} · about {weeks} weeks
              </p>
            </div>
          ) : null}

          <div className="mt-7 grid gap-2">
            {settings?.email ? (
              <ContactRow
                href={`mailto:${settings.email}`}
                icon={<MailGlyph className="size-4" />}
                label="Email"
                value={settings.email}
              />
            ) : null}
            {settings?.whatsapp ? (
              <ContactRow
                href={`https://wa.me/${settings.whatsapp}`}
                external
                icon={<ChatGlyph className="size-4" />}
                label="WhatsApp"
                value={`+${settings.whatsapp}`}
              />
            ) : null}
            {settings?.linkedin ? (
              <ContactRow
                href={settings.linkedin}
                external
                icon={<ProfileGlyph className="size-4" />}
                label="LinkedIn"
                value="Message me directly"
              />
            ) : null}
          </div>
        </Reveal>

        <Reveal delay={70}>
          <form onSubmit={onSubmit} noValidate>
            <TextBox
              id="lead-name"
              tone="dark"
              label="Your name"
              placeholder="Full name"
              autoComplete="name"
              required
              value={form.name}
              onChange={set("name")}
              error={errorFor("name")}
            />

            <TextBox
              id="lead-email"
              tone="dark"
              type="email"
              label="Email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={form.email}
              onChange={set("email")}
              error={errorFor("email")}
            />

            <TextBox
              id="lead-phone"
              tone="dark"
              label="Phone or WhatsApp"
              hint="(optional)"
              placeholder="+961 …"
              autoComplete="tel"
              value={form.phone}
              onChange={set("phone")}
            />

            <SelectBox
              id="lead-program"
              tone="dark"
              label="Program"
              options={options}
              value={form.program}
              onChange={set("program")}
            />

            <SelectBox
              id="lead-format"
              tone="dark"
              label="Format"
              options={FORMATS}
              value={form.format}
              onChange={set("format")}
            />

            <TextArea
              id="lead-message"
              tone="dark"
              label="Where are you starting from?"
              placeholder="Your level, your goal, and when you want to start."
              value={form.message}
              onChange={set("message")}
            />

            <Button type="submit" variant="light" disabled={submit.isPending}>
              {submit.isPending ? "Sending…" : "Send my request"}
            </Button>

            {submit.isSuccess ? (
              <p role="status" className="mt-3 text-[0.95rem] text-secondary">
                Got it. I will reply to you by email shortly.
              </p>
            ) : null}
            {submit.isError && !fieldErrors ? (
              <p role="alert" className="mt-3 text-[0.95rem] text-secondary">
                {(submit.error as Error).message}
              </p>
            ) : null}
            {!submit.isSuccess && !submit.isError ? (
              <p className="mt-2.5 text-[0.95rem] text-muted">Sent straight to me — no mail app needed.</p>
            ) : null}
          </form>
        </Reveal>
      </Container>
    </section>
  );
}

/**
 * One way to get in touch. The whole row is the link, so the focus ring frames
 * something meaningful rather than spanning an empty column.
 */
function ContactRow({
  href,
  icon,
  label,
  value,
  external = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-3.5 rounded-card border border-border-dark bg-surface-dark px-4 py-3 no-underline transition-colors hover:border-secondary"
    >
      <span className="grid size-9 flex-none place-items-center rounded-card bg-ink text-secondary">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-mono text-[0.7rem] tracking-wide text-on-dark-muted uppercase">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-[0.95rem] font-semibold text-white">{value}</span>
      </span>
      <span
        aria-hidden="true"
        className="font-mono text-on-dark-muted transition-transform group-hover:translate-x-0.5 group-hover:text-secondary"
      >
        {external ? "↗" : "→"}
      </span>
    </a>
  );
}
