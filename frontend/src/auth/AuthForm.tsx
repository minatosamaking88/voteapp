import { AuthField } from './AuthField.js';
import { useAuthForm } from './useAuthForm.js';
import type { AuthMode } from './useAuthForm.js';

type AuthFormProps = { mode: AuthMode };

export function AuthForm({ mode }: AuthFormProps) {
  const {
    values,
    fieldErrors,
    formError,
    pending,
    errorSummary,
    validationCompleted,
    submit,
    updateValue,
  } = useAuthForm(mode);

  return (
    <form className="grid gap-5" noValidate onSubmit={submit}>
      {formError && (
        <div
          ref={errorSummary}
          className="rounded-control border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive focus-visible:outline-2 focus-visible:outline-ring"
          role="alert"
          tabIndex={-1}
        >
          <p className="font-medium">{formError}</p>
          {Object.keys(fieldErrors).length > 1 && (
            <p className="mt-1">Review the fields below and try again.</p>
          )}
        </div>
      )}

      {mode === 'register' && (
        <AuthField
          id="name"
          label="Name"
          autoComplete="name"
          maxLength={80}
          value={values.name}
          errors={fieldErrors.name ?? []}
          showEmptyState={validationCompleted}
          onChange={(value) => updateValue('name', value)}
        />
      )}
      <AuthField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        maxLength={254}
        value={values.email}
        errors={fieldErrors.email ?? []}
        showEmptyState={validationCompleted}
        onChange={(value) => updateValue('email', value)}
      />
      <AuthField
        id="password"
        label="Password"
        type="password"
        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        minLength={12}
        maxLength={128}
        value={values.password}
        errors={fieldErrors.password ?? []}
        showEmptyState={validationCompleted}
        onChange={(value) => updateValue('password', value)}
      />

      <button
        className="mt-1 min-h-12 rounded-control bg-primary px-5 font-semibold text-primary-foreground transition duration-150 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending
          ? mode === 'register'
            ? 'Creating account…'
            : 'Signing in…'
          : mode === 'register'
            ? 'Create account'
            : 'Log in'}
      </button>
    </form>
  );
}
