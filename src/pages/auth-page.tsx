import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginSchema, registerSchema } from "../../shared/contracts";
import { useAuth } from "../auth/auth-context";
import { errorMessage } from "../lib/api";

type AuthPageProps = { mode: "login" | "register" };

export function AuthPage({ mode }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const registering = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const credentials = registering
      ? registerSchema.safeParse({ name, email, password })
      : loginSchema.safeParse({ email, password });
    if (!credentials.success) {
      setError(
        credentials.error.issues[0]?.message ??
          "Check the form values and try again.",
      );
      return;
    }

    setPending(true);
    try {
      if (registering) {
        await signUp(name, credentials.data.email, credentials.data.password);
      } else {
        await signIn(credentials.data.email, credentials.data.password);
      }
      navigate("/", { replace: true });
    } catch (submitError) {
      setError(errorMessage(submitError, "Could not sign you in. Try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl place-items-center px-4 py-12 sm:px-6">
      <form
        onSubmit={submit}
        className="motion-safe:animate-rise w-full max-w-md space-y-6 rounded-container border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <header className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-card-foreground">
            {registering ? "Create your account" : "Sign in to the board"}
          </h1>
          <p className="text-base text-muted-foreground">
            {registering
              ? "Join the conversation and share ideas."
              : "See requests and support the ideas that matter."}
          </p>
        </header>

        {registering && (
          <label className="grid gap-2 text-sm font-medium text-card-foreground">
            Name
            <input
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-12 rounded-control border border-border bg-background px-3 text-base font-normal"
            />
          </label>
        )}
        <label className="grid gap-2 text-sm font-medium text-card-foreground">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-12 rounded-control border border-border bg-background px-3 text-base font-normal"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-card-foreground">
          Password
          <input
            type="password"
            autoComplete={registering ? "new-password" : "current-password"}
            required
            minLength={registering ? 12 : 1}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-12 rounded-control border border-border bg-background px-3 text-base font-normal"
          />
          {registering && (
            <span className="text-sm font-normal text-muted-foreground">
              Use at least 12 characters.
            </span>
          )}
        </label>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-control bg-primary px-6 font-semibold text-primary-foreground transition hover:brightness-95 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        >
          {pending
            ? "Please wait…"
            : registering
              ? "Create account"
              : "Sign in"}
        </button>
        <p className="text-sm text-muted-foreground">
          {registering ? "Already have an account? " : "New to the board? "}
          <Link
            to={registering ? "/login" : "/register"}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            {registering ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </form>
    </section>
  );
}
