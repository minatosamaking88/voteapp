import type { AdminSummaryResponse } from "../../shared/contracts";

const summaryItems = [
  { key: "total", label: "Total features" },
  { key: "planned", label: "Planned" },
  { key: "inProgress", label: "In Progress" },
  { key: "shipped", label: "Shipped" },
] as const;

export function SummaryCards({
  summary,
  loading,
}: {
  summary: AdminSummaryResponse | undefined;
  loading: boolean;
}) {
  return (
    <section
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Feature status summary"
    >
      {summaryItems.map((item) => (
        <article
          key={item.key}
          className="motion-safe:animate-rise rounded-container border border-border bg-card p-6 shadow-sm"
        >
          <h2 className="text-sm font-medium text-muted-foreground">
            {item.label}
          </h2>
          {loading && !summary ? (
            <div
              className="mt-3 h-9 w-16 animate-pulse rounded-control bg-muted"
              role="status"
              aria-label={`Loading ${item.label.toLowerCase()}`}
            />
          ) : (
            <p className="mt-3 font-heading text-3xl font-semibold tabular-nums text-card-foreground">
              {summary?.[item.key] ?? "—"}
            </p>
          )}
        </article>
      ))}
    </section>
  );
}
