import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Container, Spinner, TextBox } from "@shared/ui";
import { useSite } from "../api/queries";
import { useTrainee } from "../state/TraineeContext";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

/** One screen, two modes: create an account, or come back to one. */
export default function JoinPage({ mode }: { mode: "join" | "signin" }) {
  const site = useSite();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { join, signIn } = useTrainee();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const joining = mode === "join";
  const next = params.get("next") || "/bootcamp";

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
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
    <>
      <Header settings={site.data?.settings} sections={site.data?.sections} />

      <main>
        <Container className="py-16">
          <div className="mx-auto max-w-[26rem]">
            <h1 className="text-step-3">{joining ? "Create your account" : "Welcome back"}</h1>
            <p className="mt-3 text-ink-2">
              {joining
                ? "It takes a moment, and it is what keeps your progress and feedback together."
                : "Sign in to pick up where you left off."}
            </p>

            <form onSubmit={onSubmit} className="mt-8">
              {joining ? (
                <TextBox
                  label="Your name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              ) : null}

              <TextBox
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextBox
                label="Password"
                type="password"
                hint={joining ? "at least 8 characters" : undefined}
                autoComplete={joining ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error ? (
                <Alert tone="danger" className="mb-4">
                  {error}
                </Alert>
              ) : null}

              <Button type="submit" fullWidth disabled={busy}>
                {busy ? <Spinner /> : null}
                {joining ? "Create account" : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-[0.9rem] text-muted">
              {joining ? "Already have an account? " : "New here? "}
              <Link
                to={`${joining ? "/signin" : "/join"}?next=${encodeURIComponent(next)}`}
                className="text-primary underline underline-offset-4"
              >
                {joining ? "Sign in" : "Create one"}
              </Link>
            </p>
          </div>
        </Container>
      </main>

      <Footer settings={site.data?.settings} />
    </>
  );
}
