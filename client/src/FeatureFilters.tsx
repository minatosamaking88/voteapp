import { useEffect, useRef, useState } from "react";
import {
  FEATURE_SEARCH_MAX_LENGTH,
  FEATURE_STATUSES,
  FEATURE_STATUS_LABELS,
} from "@featurevote/shared/contracts";

type FeatureFiltersProps = {
  search: string;
};

export function FeatureFilters({ search }: FeatureFiltersProps) {
  const filters = new URLSearchParams(search);
  const [searchText, setSearchText] = useState(filters.get("q") ?? "");
  const selectedStatus = filters.get("status") ?? "";
  const selectedSort = filters.get("sort") ?? "votes";
  const form = useRef<HTMLFormElement>(null);
  const searchTimer = useRef<number>(0);
  const hasFilters = Boolean(
    searchText || selectedStatus || selectedSort !== "votes",
  );

  useEffect(() => {
    return () => window.clearTimeout(searchTimer.current);
  }, []);

  function submitFilters() {
    window.clearTimeout(searchTimer.current);
    form.current?.requestSubmit();
  }

  return (
    <form
      className="board-filters"
      action="/features"
      method="get"
      ref={form}
      aria-label="Filter feature requests"
    >
      <label className="search-field">
        <span>Search titles</span>
        <input
          type="search"
          name="q"
          value={searchText}
          maxLength={FEATURE_SEARCH_MAX_LENGTH}
          placeholder="Try “dark mode”"
          onChange={(event) => {
            setSearchText(event.currentTarget.value);
            window.clearTimeout(searchTimer.current);
            searchTimer.current = window.setTimeout(submitFilters, 300);
          }}
        />
      </label>
      <label>
        <span>Status</span>
        <select
          name="status"
          defaultValue={selectedStatus}
          onChange={submitFilters}
        >
          <option value="">All statuses</option>
          {FEATURE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {FEATURE_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Sort by</span>
        <select
          name="sort"
          defaultValue={selectedSort}
          onChange={submitFilters}
        >
          <option value="votes">Most voted</option>
          <option value="newest">Newest</option>
        </select>
      </label>
      {hasFilters && (
        <a className="clear-filters" href="/features">
          Clear filters
        </a>
      )}
    </form>
  );
}
