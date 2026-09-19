import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, ButtonAnchor, ButtonLink, CheckGlyph, Container, Spinner } from "@shared/ui";
import { api } from "../api/client";
import { useProgram, useSite } from "../api/queries";
import { useTrainee } from "../state/TraineeContext";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PageState } from "../components/PageState";

interface RedeemResult {
  ok: boolean;
  alreadyHad: boolean;
  programs: Array<{ id: string; title: string; slug: string }>;
}

/**
 * Where "Enroll now" leads: enter the code you were given and the program
 * opens. Payment happens off the site — a code is the receipt for it — so this
 * screen has to answer "where do I get one?" as plainly as it asks for it.
 */
export default function EnrollPage() {
  const { slug } = useParams();
  const site = useSite();
  const { trainee, ready } = useTrainee();
  const { data: program, isLoading } = useProgram(slug);

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<RedeemResult | null>(null);

  if (!ready || isLoading) return <PageState kind="loading" />;

  const settings = site.data?.settings;
  const backTo = slug ? `/programs/${slug}` : "/#programs";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await api<RedeemResult>("/me/redeem", {
        method: "POST",
        body: { code: code.trim() },
      });
      setDone(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header settings={settings} sections={site.data?.sections} />

      <main>
        <Container className="py-14 md:py-20">
          <div className="mx-auto max-w-[34rem]">
            <Link
              to={backTo}
              className="font-mono text-[0.82rem] text-muted no-underline underline-offset-4 hover:text-primary hover:underline"
            >
              ← {program?.title ?? "All programs"}
            </Link>

            {done ? (
              /* ---------------------------- done ---------------------------- */
              <div className="mt-6">
                <span className="grid size-12 place-items-center rounded-full bg-secondary-soft text-secondary-deep">
                  <CheckGlyph className="size-6" />
                </span>
                <h1 className="mt-5 text-step-3">
                  {done.alreadyHad ? "You already have this" : "You're in"}
                </h1>
                <p className="mt-3 text-ink-2">
                  {done.alreadyHad
                    ? "That code was already applied to your account, so nothing changed."
                    : `Unlocked: ${done.programs.map((p) => p.title).join(", ")}. Every lesson is open now.`}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <ButtonLink to={`/programs/${done.programs[0]?.slug ?? slug}`}>
                    Start the course
                  </ButtonLink>
                  <ButtonLink to="/account" variant="ghost">
                    Your account
                  </ButtonLink>
                </div>
              </div>
            ) : !trainee ? (
              /* ------------------------ not signed in ----------------------- */
              <div className="mt-6">
                <h1 className="text-step-3">Sign in to enrol</h1>
                <p className="mt-3 max-w-[46ch] text-ink-2">
                  A code unlocks a program for one account, so we need to know whose. It takes a
                  moment, and your progress is kept with it afterwards.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <ButtonLink to={`/join?next=/programs/${slug}/enroll`}>Create an account</ButtonLink>
                  <ButtonLink to={`/signin?next=/programs/${slug}/enroll`} variant="ghost">
                    I already have one
                  </ButtonLink>
                </div>
              </div>
            ) : (
              /* -------------------------- the form -------------------------- */
              <div className="mt-6">
                <h1 className="text-step-3">Enrol on {program?.title ?? "this program"}</h1>
                <p className="mt-3 max-w-[48ch] text-ink-2">
                  Enter the code you were given and every lesson opens on this account,{" "}
                  <b className="font-semibold text-ink">{trainee.name}</b>.
                </p>

                <form onSubmit={submit} className="mt-8">
                  <label htmlFor="code" className="mb-1.5 block text-[0.84rem] font-medium text-ink">
                    Access code
                  </label>
                  <input
                    id="code"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="MERN-2026"
                    className="h-12 w-full rounded-card border border-line-strong bg-panel px-4 font-mono text-[1rem] tracking-[0.08em] text-ink uppercase transition-[border-color,box-shadow] outline-none placeholder:tracking-normal placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/12"
                  />

                  {error ? (
                    <p
                      role="alert"
                      className="mt-3 rounded-card border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-[0.9rem] text-danger"
                    >
                      {error}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    fullWidth
                    className="mt-4"
                    disabled={busy || code.trim().length < 3}
                  >
                    {busy ? <Spinner /> : null}
                    {busy ? "Checking…" : "Unlock the course"}
                  </Button>
                </form>

                {/* The question this page has to answer as loudly as it asks. */}
                <section className="mt-10 rounded-panel border border-line-strong bg-panel px-6 py-6">
                  <h2 className="font-display text-[1.1rem] font-extrabold">
                    Don't have a code?
                  </h2>
                  <p className="mt-2 text-[0.95rem] leading-snug text-ink-2">
                    {settings?.enrolHowTo ??
                      "Codes are issued once your place is confirmed. Get in touch and we will send yours."}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <ButtonLink to="/book" size="sm">
                      Book an intro call
                    </ButtonLink>
                    {settings?.whatsapp ? (
                      <ButtonAnchor
                        href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="quiet"
                        size="sm"
                      >
                        WhatsApp
                      </ButtonAnchor>
                    ) : null}
                    {settings?.email ? (
                      <ButtonAnchor
                        href={`mailto:${settings.email}?subject=${encodeURIComponent(
                          `Access code — ${program?.title ?? "a program"}`
                        )}`}
                        variant="quiet"
                        size="sm"
                      >
                        Email us
                      </ButtonAnchor>
                    ) : null}
                  </div>
                </section>

                <p className="mt-6 text-[0.88rem] text-muted">
                  Every program has free lessons you can read and try before enrolling —{" "}
                  <Link to={backTo} className="text-primary underline underline-offset-4">
                    have a look first
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        </Container>
      </main>

      <Footer settings={settings} />
    </>
  );
}
