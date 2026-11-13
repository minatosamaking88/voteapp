const skeletonRows = [
  "feature-skeleton-1",
  "feature-skeleton-2",
  "feature-skeleton-3",
  "feature-skeleton-4",
  "feature-skeleton-5",
  "feature-skeleton-6",
];

export function FeatureListLoading() {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-label="Loading feature requests"
    >
      {skeletonRows.map((row) => (
        <div
          key={row}
          className="h-16 animate-pulse rounded-container bg-muted"
        />
      ))}
    </div>
  );
}

export function FeatureListError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="rounded-container border border-destructive/40 bg-card p-6"
      role="alert"
    >
      <p className="text-destructive">
        Could not load feature requests: {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 min-h-11 rounded-control bg-primary px-4 font-semibold text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}

export function FeatureListRefreshFeedback({
  error,
  loading,
  onRetry,
}: {
  error: string | null;
  loading: boolean;
  onRetry: () => void;
}) {
  if (!error && !loading) return null;

  return (
    <>
      {error && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-destructive/40 bg-card px-4 py-3"
          role="alert"
        >
          <p className="text-sm text-destructive">
            Could not refresh requests: {error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 px-3 font-semibold text-primary underline-offset-4 hover:underline"
          >
            Retry
          </button>
        </div>
      )}
      {loading && (
        <p className="text-sm text-muted-foreground" role="status">
          Refreshing requests…
        </p>
      )}
    </>
  );
}
