import { AuthForm } from "./AuthForm";

type AuthPageProps = {
  mode: "login" | "register";
};

export function AuthPage({ mode }: AuthPageProps) {
  const registering = mode === "register";

  return (
    <main className="auth-page">
      <a className="skip-link" href="#auth-content">
        Skip to content
      </a>
      <a className="brand auth-brand" href="/features">
        FeatureVote
      </a>
      <section
        className="auth-card"
        id="auth-content"
        aria-labelledby="auth-title"
      >
        <h1 className="page-title" id="auth-title">
          {registering ? "Create your account" : "Welcome back"}
        </h1>
        <p className="page-intro">
          {registering
            ? "Join the community and help shape what comes next."
            : "Sign in to share and vote on product ideas."}
        </p>
        <AuthForm mode={mode} />
        <p className="auth-switch">
          {registering ? "Already have an account?" : "New to FeatureVote?"}{" "}
          <a href={registering ? "/login" : "/register"}>
            {registering ? "Sign in" : "Create an account"}
          </a>
        </p>
      </section>
    </main>
  );
}
