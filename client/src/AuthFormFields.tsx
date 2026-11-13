import {
  DISPLAY_NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@featurevote/shared/contracts";

type FieldErrors = Record<string, string[]>;

type AuthFormFieldsProps = {
  mode: "login" | "register";
  name: string;
  email: string;
  password: string;
  fieldErrors: FieldErrors;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onFieldBlur: (field: "name" | "email" | "password", value: string) => void;
};

export function AuthFormFields({
  mode,
  name,
  email,
  password,
  fieldErrors,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onFieldBlur,
}: AuthFormFieldsProps) {
  return (
    <>
      {mode === "register" && (
        <label className="form-field">
          <span>
            Display name <span className="required-note">(required)</span>
          </span>
          <input
            name="name"
            value={name}
            autoComplete="name"
            maxLength={DISPLAY_NAME_MAX_LENGTH}
            required
            aria-invalid={Boolean(fieldErrors.name?.length)}
            aria-describedby={
              fieldErrors.name?.length ? "name-error" : undefined
            }
            onBlur={() => onFieldBlur("name", name)}
            onChange={(event) => onNameChange(event.currentTarget.value)}
          />
          {fieldErrors.name?.length ? (
            <span id="name-error" className="field-error">
              {fieldErrors.name.join(" ")}
            </span>
          ) : null}
        </label>
      )}
      <label className="form-field">
        <span>
          Email <span className="required-note">(required)</span>
        </span>
        <input
          name="email"
          type="email"
          value={email}
          autoComplete="email"
          maxLength={EMAIL_MAX_LENGTH}
          required
          aria-invalid={Boolean(fieldErrors.email?.length)}
          aria-describedby={
            fieldErrors.email?.length ? "email-error" : undefined
          }
          onBlur={() => onFieldBlur("email", email)}
          onChange={(event) => onEmailChange(event.currentTarget.value)}
        />
        {fieldErrors.email?.length ? (
          <span id="email-error" className="field-error">
            {fieldErrors.email.join(" ")}
          </span>
        ) : null}
      </label>
      <label className="form-field">
        <span>
          Password <span className="required-note">(required)</span>
        </span>
        <input
          name="password"
          type="password"
          value={password}
          autoComplete={
            mode === "register" ? "new-password" : "current-password"
          }
          minLength={mode === "register" ? PASSWORD_MIN_LENGTH : 1}
          maxLength={PASSWORD_MAX_LENGTH}
          required
          aria-invalid={Boolean(fieldErrors.password?.length)}
          aria-describedby={
            fieldErrors.password?.length ? "password-error" : undefined
          }
          onBlur={() => onFieldBlur("password", password)}
          onChange={(event) => onPasswordChange(event.currentTarget.value)}
        />
        {fieldErrors.password?.length ? (
          <span id="password-error" className="field-error">
            {fieldErrors.password.join(" ")}
          </span>
        ) : null}
      </label>
    </>
  );
}
