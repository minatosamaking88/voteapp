type AuthFieldProps = {
  id: string;
  label: string;
  type?: string;
  autoComplete: string;
  minLength?: number;
  maxLength: number;
  value: string;
  errors: string[];
  showEmptyState: boolean;
  onChange: (value: string) => void;
};

export function AuthField({
  id,
  label,
  type = 'text',
  autoComplete,
  minLength,
  maxLength,
  value,
  errors,
  showEmptyState,
  onChange,
}: AuthFieldProps) {
  const errorId = `${id}-error`;
  const hasError = errors.length > 0;

  return (
    <div className="grid gap-2">
      <label className="font-medium" htmlFor={id}>
        {label} <span className="text-sm text-muted-foreground">Required</span>
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        minLength={minLength}
        maxLength={maxLength}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        className="min-h-12 rounded-control border border-border bg-card px-4 text-base text-foreground outline-none transition duration-150 placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
      />
      {hasError ? (
        <ul className="grid gap-1 text-sm text-destructive" id={errorId}>
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : (
        showEmptyState && (
          <p className="text-sm text-muted-foreground" role="status">
            No validation issues.
          </p>
        )
      )}
    </div>
  );
}
