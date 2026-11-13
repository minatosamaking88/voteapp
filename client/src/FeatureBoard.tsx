import { FeatureCard } from "./FeatureCard";
import { FeatureFilters } from "./FeatureFilters";
import { FeaturePagination } from "./FeaturePagination";
import { useFeatureBoard } from "./use-feature-board";

type FeatureBoardProps = {
  search: string;
};

export function FeatureBoard({ search }: FeatureBoardProps) {
  const filters = new URLSearchParams(search);
  const apiFilters = new URLSearchParams(filters);
  apiFilters.delete("created");
  const queryString = apiFilters.toString();
  const {
    items,
    total,
    page,
    pageSize,
    loading,
    error,
    actionMessage,
    pendingIds,
    refresh,
    toggleVote,
  } = useFeatureBoard(queryString);
  const hasFilters = Boolean(filters.get("q") || filters.get("status"));
  const creationNotice = filters.get("created") === "1";

  return (
    <section className="board-page" aria-labelledby="board-title">
      <div className="page-heading">
        <div>
          <h1 className="page-title" id="board-title">
            Feature board
          </h1>
          <p className="page-intro">
            Share ideas and vote for the improvements you want to see.
          </p>
        </div>
        <a className="button button-primary" href="/features/new">
          Add feature
        </a>
      </div>

      {creationNotice && (
        <p className="success-message" role="status">
          Your feature request was added.
        </p>
      )}
      {actionMessage && (
        <p className="success-message" role="status">
          {actionMessage}
        </p>
      )}
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button
            className="button button-quiet"
            type="button"
            onClick={() => void refresh()}
          >
            Retry
          </button>
        </div>
      )}

      <FeatureFilters search={search} />

      {loading && items.length === 0 ? (
        <div
          className="feature-grid"
          role="status"
          aria-label="Loading features"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div className="feature-skeleton" key={index} />
          ))}
        </div>
      ) : error && items.length === 0 ? null : items.length > 0 ? (
        <>
          <div className="feature-grid">
            {items.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                busy={pendingIds.has(feature.id)}
                onToggleVote={(selectedFeature) =>
                  void toggleVote(selectedFeature)
                }
              />
            ))}
          </div>
          <FeaturePagination
            total={total}
            page={page}
            pageSize={pageSize}
            search={search}
          />
        </>
      ) : loading ? null : hasFilters ? (
        <div className="empty-state">
          <h2>No feature requests match those filters</h2>
          <p>
            Try another title or status, or clear your filters to see every
            request.
          </p>
          <a className="button button-secondary" href="/features">
            Clear filters
          </a>
        </div>
      ) : (
        <div className="empty-state">
          <h2>No feature requests yet</h2>
          <p>
            Start the conversation by sharing the first improvement you would
            like to see.
          </p>
          <a className="button button-primary" href="/features/new">
            Add the first feature
          </a>
        </div>
      )}
    </section>
  );
}
