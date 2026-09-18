import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, ButtonLink, Container, Spinner, TextBox } from "@shared/ui";
import { api } from "../api/client";
import { useMyEnrollments, useSite } from "../api/queries";
import { useTrainee } from "../state/TraineeContext";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PageState } from "../components/PageState";

/**
 * Everything the account holder owns: who they are, what gets them in, and the
 * way out. One page rather than a settings tree — there are three things here,
 * and hiding three things behind tabs would be worse than listing them.
 */
export default function AccountPage() {
  const site = useSite();
  const navigate = useNavigate();
  const { trainee, ready, signOut } = useTrainee();
  const enrollments = useMyEnrollments(ready && Boolean(trainee));

  if (!ready) return <PageState kind="loading" />;

  if (!trainee) {
    return (
      <>
        <Header settings={site.data?.settings} sections={site.data?.sections} />
        <Container className="py-24">
          <h1 className="text-step-3">Sign in to see your account</h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink to="/signin?next=/account">Sign in</ButtonLink>
            <ButtonLink to="/join?next=/account" variant="ghost">
              Create an account
            </ButtonLink>
          </div>
        </Container>
        <Footer settings={site.data?.settings} />
      </>
    );
  }

  return (
    <>
      <Header settings={site.data?.settings} sections={site.data?.sections} />

      <main>
        <Container className="py-12 md:py-16">
          <div className="mx-auto flex max-w-[42rem] flex-col">
            <header className="flex flex-wrap items-center gap-4 border-b border-line pb-7">
              <span
                aria-hidden="true"
                className="grid size-14 flex-none place-items-center rounded-full bg-primary-soft font-display text-[1.4rem] font-extrabold text-primary"
              >
                {trainee.name.trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h1 className="text-step-3">{trainee.name}</h1>
                <p className="mt-0.5 font-mono text-[0.84rem] text-muted">{trainee.email}</p>
              </div>
              {enrollments.data?.length ? (
                <Link
                  to="/bootcamp"
                  className="ml-auto font-mono text-[0.8rem] whitespace-nowrap text-primary underline-offset-4 hover:underline"
                >
                  {enrollments.data.length} track
                  {enrollments.data.length === 1 ? "" : "s"} →
                </Link>
              ) : null}
            </header>

            <NameCard />
            <PasswordCard />

            <Section
              title="Sign out"
              blurb="Ends this session on this device. Your progress and submissions stay where they are."
            >
              <Button
                variant="ghost"
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
              >
                Sign out
              </Button>
            </Section>
          </div>
        </Container>
      </main>

      <Footer settings={site.data?.settings} />
    </>
  );
}

/* ------------------------------ name ------------------------------ */

function NameCard() {
  const { trainee, rename } = useTrainee();
  const [name, setName] = useState(trainee?.name ?? "");
  const [state, setState] = useState<Status>({ kind: "idle" });

  // Another tab, or the rename itself, can move it under us.
  useEffect(() => setName(trainee?.name ?? ""), [trainee?.name]);

  const dirty = name.trim() !== (trainee?.name ?? "") && name.trim().length >= 2;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!dirty) return;
    setState({ kind: "busy" });
    try {
      await rename(name.trim());
      setState({ kind: "done", message: "Your name is updated." });
    } catch (err) {
      setState({ kind: "error", message: (err as Error).message });
    }
  };

  return (
    <Section title="Your name" blurb="Shown on your submissions and to anyone reviewing your work.">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:max-w-[26rem]">
        <TextBox
          label="Name"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setState({ kind: "idle" });
          }}
        />
        <Feedback state={state} />
        <div>
          <Button type="submit" disabled={!dirty || state.kind === "busy"}>
            {state.kind === "busy" ? <Spinner /> : null}
            Save name
          </Button>
        </div>
      </form>
    </Section>
  );
}

/* ---------------------------- password ---------------------------- */

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<Status>({ kind: "idle" });

  const mismatch = confirm.length > 0 && confirm !== next;
  const ready = current.length > 0 && next.length >= 8 && next === confirm;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setState({ kind: "busy" });
    try {
      await api<{ ok: boolean }>("/auth/password", {
        method: "POST",
        body: { currentPassword: current, newPassword: next },
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      setState({ kind: "done", message: "Your password is changed." });
    } catch (err) {
      setState({ kind: "error", message: (err as Error).message });
    }
  };

  return (
    <Section
      title="Password"
      blurb="You need your current one to set a new one — that is what stops someone using an unattended tab."
    >
      <form onSubmit={submit} className="flex flex-col gap-3 sm:max-w-[26rem]">
        <TextBox
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
            setState({ kind: "idle" });
          }}
        />
        <TextBox
          label="New password"
          type="password"
          hint="at least 8 characters"
          autoComplete="new-password"
          minLength={8}
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <TextBox
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          error={mismatch ? "Those passwords do not match." : undefined}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Feedback state={state} />
        <div>
          <Button type="submit" disabled={!ready || state.kind === "busy"}>
            {state.kind === "busy" ? <Spinner /> : null}
            Change password
          </Button>
        </div>
      </form>
    </Section>
  );
}

/* ----------------------------- shared ----------------------------- */

type Status =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

function Feedback({ state }: { state: Status }) {
  if (state.kind !== "done" && state.kind !== "error") return null;

  return (
    <p
      role="status"
      className={`text-[0.88rem] ${
        state.kind === "done" ? "text-secondary-deep" : "text-danger"
      }`}
    >
      {state.message}
    </p>
  );
}

function Section({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-line py-7 last:border-b-0">
      <h2 className="font-display text-[1.15rem] font-extrabold tracking-[-0.01em]">{title}</h2>
      <p className="mt-1 mb-5 max-w-[56ch] text-[0.92rem] leading-snug text-muted">{blurb}</p>
      {children}
    </section>
  );
}
