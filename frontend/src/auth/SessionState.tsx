type SessionStateProps = {
  message: string;
  onRetry?: () => void;
};

export function SessionState({ message, onRetry }: SessionStateProps) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="grid justify-items-center gap-4 text-center" aria-live="polite">
        <p className="text-base text-muted-foreground" role="status">
          {message}
        </p>
        {onRetry && (
          <button
            className="min-h-11 rounded-control border border-border bg-card px-4 font-medium text-foreground transition hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            type="button"
            onClick={onRetry}
          >
            Try again
          </button>
        )}
      </div>
    </main>
  );
}
