import { useId, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckGlyph, Spinner } from "@shared/ui";
import { useSite } from "../api/queries";
import { Header } from "../components/Header";
import { useTrainee } from "../state/TraineeContext";

/**
 * One screen, two modes: create an account, or come back to one.
 *
 * Split down the middle on a wide screen — the work on the left, the form on
 * the right. Below `lg` the panel is dropped rather than stacked: on a phone
 * it would push the fields under a screenful of decoration.
 *
 * The site nav stays on top. Stripping it converts better, but a visitor who
 * arrived here while still looking around would be stranded, and that costs
 * more than the extra links do.
 */
export default function JoinPage({ mode }: { mode: "join" | "signin" }) {
  const site = useSite();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { join, signIn } = useTrainee();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reveal, setReveal] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const joining = mode === "join";
  const next = params.get("next") || "/bootcamp";

  // Only complain once there is something to compare: flagging a mismatch on
  // the first keystroke of the second field is just noise.
  const mismatch = joining && confirm.length > 0 && confirm !== password;
  const matched = joining && confirm.length > 0 && confirm === password;

  // One toggle behind both fields: checking one password against the other is
  // exactly when you want to see them, and hiding only half would be odd.
  const toggleReveal = () => setReveal((v) => !v);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (joining && password !== confirm) {
      setError("Those passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (joining) await join(name, email, password);
      else await signIn(email, password);
      navigate(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    // Column: the nav keeps its height, the split takes whatever is left.
    <div className="flex min-h-screen flex-col">
      {/* Someone who landed here while still looking around needs a way out
          that is not the back button, so the site nav stays. */}
      <Header settings={site.data?.settings} sections={site.data?.sections} />

      <div className="flex flex-1 flex-col lg:flex-row">
        <CodePanel />

        {/* ---- the form ---- */}
        <main className="flex flex-1 flex-col justify-center px-5 py-12 sm:px-8 lg:px-12">
          <div className="mx-auto flex w-full max-w-[23.5rem] flex-col">
            <h1 className="font-display text-[1.5rem] leading-tight font-extrabold tracking-[-0.02em]">
              {joining ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1.5 text-[0.9rem] leading-snug text-muted">
              {joining ? "Free, and it takes a moment." : "Sign in to pick up where you left off."}
            </p>

            <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
              {joining ? (
                <AuthField
                  label="Full name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              ) : null}

              <AuthField
                label="Email address"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <AuthField
                label="Password"
                note={joining ? "8 characters minimum" : undefined}
                type={reveal ? "text" : "password"}
                autoComplete={joining ? "new-password" : "current-password"}
                required
                minLength={joining ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={(e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false)}
                onBlur={() => setCapsLock(false)}
                adornment={<RevealButton reveal={reveal} onToggle={toggleReveal} />}
              />

              {joining ? (
                <AuthField
                  label="Confirm password"
                  type={reveal ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  error={mismatch ? "Those passwords do not match." : undefined}
                  // Two controls need more room than one.
                  className={matched ? "pr-[4.6rem]" : ""}
                  adornment={
                    <span className="flex items-center">
                      {/* A tick the moment the two agree, so it is clear the
                          field is satisfied without having to re-read both. */}
                      {matched ? (
                        <span className="grid size-8 place-items-center text-secondary-deep">
                          <CheckGlyph className="size-4" />
                        </span>
                      ) : null}
                      <RevealButton reveal={reveal} onToggle={toggleReveal} />
                    </span>
                  }
                />
              ) : null}

              {/* Worth saying before the attempt fails, not after. */}
              {capsLock ? (
                <p className="-mt-1 flex items-center gap-1.5 text-[0.82rem] text-muted">
                  <span aria-hidden="true">⇪</span> Caps Lock is on
                </p>
              ) : null}

              {error ? (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-card border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-[0.88rem] leading-snug text-danger"
                >
                  <span aria-hidden="true" className="mt-px font-semibold">
                    !
                  </span>
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy || mismatch}
                className="mt-1 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-card bg-primary text-[0.95rem] font-semibold text-white transition-[background-color,opacity] hover:bg-primary-deep focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? <Spinner /> : null}
                {busy
                  ? joining
                    ? "Creating account…"
                    : "Signing in…"
                  : joining
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>

            <p className="mt-7 text-[0.9rem] text-muted">
              {joining ? "Already have an account? " : "New here? "}
              <Link
                to={`${joining ? "/signin" : "/join"}?next=${encodeURIComponent(next)}`}
                className="font-semibold text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
              >
                {joining ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * The left half: an editor, drawn rather than photographed. A stock photo of a
 * laptop would need a licence and would still be someone else's desk; this is
 * vector, so it is sharp on any display and costs no request.
 */
function CodePanel() {
  return (
    <aside className="relative hidden shrink-0 flex-col justify-center overflow-hidden bg-ink px-12 py-16 lg:flex lg:w-[46%] xl:w-[50%]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(38rem_26rem_at_18%_12%,rgba(37,64,224,0.32),transparent_68%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(30rem_22rem_at_88%_92%,rgba(233,161,59,0.16),transparent_70%)]"
      />

      <div className="relative mx-auto flex w-full max-w-[30rem] flex-col">
        <h2 className="font-display text-[2rem] leading-[1.15] font-extrabold tracking-[-0.02em] text-white">
          Learn to build software the way it's built at work.
        </h2>
        <p className="mt-4 max-w-[36ch] text-[1rem] leading-relaxed text-on-dark-muted">
          Watch the idea, build the piece, then fix the bug someone left you — and ship it.
        </p>

        <div className="mt-10 overflow-hidden rounded-panel border border-border-dark bg-surface-dark shadow-[0_24px_60px_-24px_rgba(0,0,0,0.65)]">
          <div className="flex items-center gap-2 border-b border-border-dark px-4 py-3">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-danger/80" />
            <span aria-hidden="true" className="size-2.5 rounded-full bg-secondary/80" />
            <span aria-hidden="true" className="size-2.5 rounded-full bg-primary/70" />
            <span className="ml-2 font-mono text-[0.72rem] text-muted">recipes.js</span>
          </div>

          <pre className="overflow-x-auto px-4 py-4 font-mono text-[0.78rem] leading-[1.75]">
            <code>
              <Line n={1}>
                <K>router</K>
                <P>.</P>
                <F>get</F>
                <P>(</P>
                <S>'/api/recipes'</S>
                <P>, </P>
                <K>async</K>
                <P> (req, res) =&gt; {"{"}</P>
              </Line>
              <Line n={2}>
                <P> </P>
                <K>const</K>
                <P> recipes = </P>
                <K>await</K>
                <P> Recipe.</P>
                <F>find</F>
                <P>()</P>
              </Line>
              <Line n={3}>
                <P> res.</P>
                <F>status</F>
                <P>(</P>
                <N>200</N>
                <P>).</P>
                <F>json</F>
                <P>(recipes)</P>
              </Line>
              <Line n={4}>
                <P>{"}"})</P>
              </Line>
              <Line n={5}> </Line>
              <Line n={6} muted>
                <C>{"// the list is always empty. why?"}</C>
              </Line>
            </code>
          </pre>
        </div>
      </div>
    </aside>
  );
}

/* Syntax colours, kept to the brand palette rather than an editor theme. */
const Line = ({ n, muted, children }: { n: number; muted?: boolean; children: ReactNode }) => (
  <span className={`grid grid-cols-[1.6rem_1fr] ${muted ? "opacity-80" : ""}`}>
    <span className="text-right text-muted/60 select-none">{n}</span>
    <span className="pl-3">{children}</span>
  </span>
);
const K = ({ children }: { children: ReactNode }) => <span className="text-primary-soft">{children}</span>;
const F = ({ children }: { children: ReactNode }) => <span className="text-secondary">{children}</span>;
const S = ({ children }: { children: ReactNode }) => <span className="text-tertiary-soft">{children}</span>;
const N = ({ children }: { children: ReactNode }) => <span className="text-secondary">{children}</span>;
const C = ({ children }: { children: ReactNode }) => <span className="text-muted italic">{children}</span>;
const P = ({ children }: { children: ReactNode }) => <span className="text-on-dark-muted">{children}</span>;

/**
 * A field for this form only: label and optional note on one row, a real focus
 * ring, and room on the right for a control like the reveal toggle.
 */
function AuthField({
  label,
  note,
  error,
  adornment,
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  note?: string;
  error?: string;
  adornment?: ReactNode;
}) {
  const id = useId();

  return (
    <div className="flex flex-col">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.84rem] font-medium text-ink">
          {label}
        </label>
        {note ? <span className="text-[0.78rem] text-muted">{note}</span> : null}
      </div>

      <div className="relative flex">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-11 w-full rounded-card border bg-panel px-3.5 text-[0.95rem] text-ink transition-[border-color,box-shadow] outline-none placeholder:text-muted ${
            error
              ? "border-danger focus:border-danger focus:ring-4 focus:ring-danger/12"
              : "border-line-strong focus:border-primary focus:ring-4 focus:ring-primary/12"
          } ${adornment ? "pr-12" : ""} ${className}`}
          {...rest}
        />
        {adornment ? (
          <span className="absolute inset-y-0 right-2 flex items-center">{adornment}</span>
        ) : null}
      </div>

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[0.82rem] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** The toggle itself. Both password fields render one; they share a state. */
function RevealButton({ reveal, onToggle }: { reveal: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={reveal ? "Hide passwords" : "Show passwords"}
      aria-pressed={reveal}
      className="grid size-8 cursor-pointer place-items-center rounded-card text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
    >
      <EyeGlyph off={reveal} />
    </button>
  );
}

/** Open eye, or struck through once the password is visible. */
function EyeGlyph({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" aria-hidden="true">
      <path
        d="M1.8 10S4.9 4.6 10 4.6 18.2 10 18.2 10 15.1 15.4 10 15.4 1.8 10 1.8 10Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.4" />
      {off ? (
        <path d="M3.5 3.5l13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}
