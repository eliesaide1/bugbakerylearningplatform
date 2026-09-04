import { useState, type FormEvent } from "react";
import { Alert, Button, Spinner, TextBox } from "@shared/ui";
import { useAuth } from "../auth/AuthProvider";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-6 py-12">
      <div className="w-full max-w-[420px]">
        <p className="font-display text-[1.6rem] font-extrabold">Bug Bakery</p>
        <p className="mb-7 font-mono text-[0.8rem] text-muted">content manager</p>

        <form onSubmit={onSubmit} className="border border-line-strong bg-panel p-6" noValidate>
          <h1 className="mb-5 text-step-2">Sign in</h1>

          {error ? (
            <Alert tone="danger" className="mb-4">
              {error}
            </Alert>
          ) : null}

          <TextBox
            id="login-email"
            type="email"
            label="Email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextBox
            id="login-password"
            type="password"
            label="Password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" fullWidth disabled={busy}>
            {busy ? <Spinner /> : null}
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-[0.85rem] text-muted">
          Seeded account: <code className="font-mono">admin@bugbakery.local</code> — change the password
          after your first sign-in.
        </p>
      </div>
    </div>
  );
}
