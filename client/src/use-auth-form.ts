import { useRef, useState, type FormEvent } from "react";
import {
  loginInputSchema,
  registerInputSchema,
} from "@featurevote/shared/contracts";
import { ApiClientError, requestJson } from "./api";

type FieldErrors = Record<string, string[]>;
type AuthField = "name" | "email" | "password";

export function useAuthForm(mode: "login" | "register") {
  const registering = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const errorSummary = useRef<HTMLDivElement>(null);

  function updateFieldError(field: string, messages: string[]) {
    setFieldErrors((current) => {
      const next = { ...current };
      if (messages.length > 0) next[field] = messages;
      else delete next[field];
      return next;
    });
  }

  function validateField(field: AuthField, value: string) {
    const schema =
      field === "name"
        ? registerInputSchema.shape.name
        : field === "email"
          ? loginInputSchema.shape.email
          : registering
            ? registerInputSchema.shape.password
            : loginInputSchema.shape.password;
    const result = schema.safeParse(value);
    updateFieldError(
      field,
      result.success ? [] : result.error.issues.map((issue) => issue.message),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const schema = registering ? registerInputSchema : loginInputSchema;
    const input = registering ? { name, email, password } : { email, password };
    const validation = schema.safeParse(input);
    if (!validation.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of validation.error.issues) {
        const field = String(issue.path[0] ?? "_form");
        nextErrors[field] ??= [];
        nextErrors[field].push(issue.message);
      }
      setFieldErrors(nextErrors);
      errorSummary.current?.focus();
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await requestJson(
        registering ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify(validation.data),
        },
      );
      window.location.assign("/features");
    } catch (submitError) {
      if (submitError instanceof ApiClientError) {
        setError(submitError.message);
        setFieldErrors(submitError.fieldErrors ?? {});
      } else {
        setError(
          "Your request could not be completed. Check your connection and try again.",
        );
      }
      errorSummary.current?.focus();
      setSubmitting(false);
    }
  }

  return {
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
  };
}
