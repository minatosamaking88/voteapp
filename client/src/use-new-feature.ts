import { useRef, useState, type FormEvent } from "react";
import { featureInputSchema } from "@featurevote/shared/contracts";
import { ApiClientError, requestJson } from "./api";

type FieldErrors = Record<string, string[]>;
type FeatureField = "title" | "description";

export function useNewFeature() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const errorSummary = useRef<HTMLDivElement>(null);

  function updateFieldError(field: string, messages: string[]) {
    setFieldErrors((current) => {
      const next = { ...current };
      if (messages.length > 0) next[field] = messages;
      else delete next[field];
      return next;
    });
  }

  function validateField(field: FeatureField, value: string) {
    const schema =
      field === "title"
        ? featureInputSchema.shape.title
        : featureInputSchema.shape.description;
    const result = schema.safeParse(value);
    updateFieldError(
      field,
      result.success ? [] : result.error.issues.map((issue) => issue.message),
    );
  }

  async function submitFeature(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const validation = featureInputSchema.safeParse({ title, description });
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
    setSaving(true);
    try {
      await requestJson("/api/features", {
        method: "POST",
        body: JSON.stringify(validation.data),
      });
      window.location.assign("/features?created=1");
    } catch (saveError) {
      if (saveError instanceof ApiClientError) {
        setError(saveError.message);
        setFieldErrors(saveError.fieldErrors ?? {});
      } else {
        setError(
          "Your feature was not saved. Check your connection and try again.",
        );
      }
      errorSummary.current?.focus();
      setSaving(false);
    }
  }

  return {
    title,
    description,
    fieldErrors,
    error,
    saving,
    errorSummary,
    setTitle,
    setDescription,
    validateField,
    submitFeature,
  };
}
