import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FEATURE_STATUSES } from "../../shared/contracts";
import { statusLabel } from "./status-label";

export function FeatureFilters({ hasFilters }: { hasFilters: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();

  function updateFilters(values: Record<string, string>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    setSearchParams(next, { replace: true });
  }

  const sortValue = `${searchParams.get("sortBy") ?? "createdAt"}:${searchParams.get("sortOrder") ?? "desc"}`;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <SearchField
        key={searchParams.get("q") ?? ""}
        value={searchParams.get("q") ?? ""}
        searchParams={searchParams}
        updateFilters={updateFilters}
      />
      <label className="grid min-w-40 gap-2 text-sm font-medium text-foreground">
        Status
        <select
          value={searchParams.get("status") ?? ""}
          onChange={(event) => updateFilters({ status: event.target.value })}
          className="min-h-11 rounded-control border border-border bg-card px-3 text-base font-normal text-card-foreground"
        >
          <option value="">All statuses</option>
          {FEATURE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </label>
      <label className="grid min-w-48 gap-2 text-sm font-medium text-foreground">
        Sort by
        <select
          value={sortValue}
          onChange={(event) => {
            const [sortBy, sortOrder] = event.target.value.split(":");
            updateFilters({
              sortBy: sortBy ?? "createdAt",
              sortOrder: sortOrder ?? "desc",
            });
          }}
          className="min-h-11 rounded-control border border-border bg-card px-3 text-base font-normal text-card-foreground"
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="votes:desc">Most votes</option>
          <option value="votes:asc">Fewest votes</option>
          <option value="title:asc">Title A–Z</option>
          <option value="title:desc">Title Z–A</option>
        </select>
      </label>
      {hasFilters && (
        <button
          type="button"
          className="min-h-11 px-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
          onClick={() => setSearchParams({}, { replace: true })}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function SearchField({
  value,
  searchParams,
  updateFilters,
}: {
  value: string;
  searchParams: URLSearchParams;
  updateFilters: (values: Record<string, string>) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (draft.trim() !== (searchParams.get("q") ?? "")) {
        updateFilters({ q: draft.trim() });
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [draft, searchParams, updateFilters]);

  return (
    <label className="grid min-w-56 flex-1 gap-2 text-sm font-medium text-foreground">
      Search requests
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Search by title"
        className="min-h-11 rounded-control border border-border bg-card px-3 text-base font-normal text-card-foreground placeholder:text-muted-foreground"
      />
    </label>
  );
}
