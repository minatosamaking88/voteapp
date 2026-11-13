import { AuthFormFields } from "./AuthFormFields";
import { useAuthForm } from "./use-auth-form";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const registering = mode === "register";
  const {
    name,
    email,
    password,
    fieldErrors,
    error,
    submitting,
    errorSummary,
    setName,
    setEmail,
    setPassword,
    validateField,
    submit,
  } = useAuthForm(mode);

  return (
    <>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      <div
        ref={errorSummary}
        className="form-error-summary"
        tabIndex={-1}
        aria-live="polite"
      >
        {(error || Object.keys(fieldErrors).length > 0) && (
          <p>Review the highlighted fields before continuing.</p>
        )}
      </div>
      <form className="auth-form" onSubmit={submit} noValidate>
        <AuthFormFields
          mode={mode}
          name={name}
          email={email}
          password={password}
          fieldErrors={fieldErrors}
          onNameChange={setName}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onFieldBlur={validateField}
        />
        <button
          className="button button-primary button-wide"
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? "Please wait…"
            : registering
              ? "Create account"
              : "Sign in"}
        </button>
      </form>
    </>
  );
}
