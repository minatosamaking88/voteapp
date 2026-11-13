import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../lib/api.js';
import { useAuth } from './AuthContext.js';

export type AuthMode = 'login' | 'register';

type FormValues = { name: string; email: string; password: string };

export function useAuthForm(mode: AuthMode) {
  const { authenticate } = useAuth();
  const [values, setValues] = useState<FormValues>({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const [validationCompleted, setValidationCompleted] = useState(false);
  const errorSummary = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formError) errorSummary.current?.focus();
  }, [formError]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFieldErrors({});
    setFormError('');
    setPending(true);
    setValidationCompleted(false);

    const payload =
      mode === 'register'
        ? { name: values.name, email: values.email, password: values.password }
        : { email: values.email, password: values.password };

    try {
      await authenticate(mode, payload);
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(error.message);
        setValidationCompleted(error.status === 400);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setPending(false);
    }
  }

  function updateValue(field: keyof FormValues, value: string): void {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: [] }));
    setFormError('');
    setValidationCompleted(false);
  }

  return {
    values,
    fieldErrors,
    formError,
    pending,
    errorSummary,
    validationCompleted,
    submit,
    updateValue,
  };
}
