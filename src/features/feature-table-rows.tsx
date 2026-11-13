import type {
  FeatureCard,
  FeatureListResponse,
  FeatureStatus,
} from "../../shared/contracts";
import { FeaturePagination } from "./feature-pagination";
import { FeatureRow } from "./feature-row";

export type FeatureTableRowsProps = {
  result: FeatureListResponse;
  hasFilters: boolean;
  variant: "board" | "admin";
  currentUserId: string | null;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onVote: ((featureId: string) => Promise<FeatureCard>) | null;
  onSaveStatus:
    ((featureId: string, status: FeatureStatus) => Promise<FeatureCard>) | null;
};

function FeatureListEmpty({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  if (!hasFilters) {
    return (
      <p className="rounded-container border border-dashed border-border bg-card p-8 text-center text-base text-muted-foreground">
        No feature requests yet. Add the first idea to get the conversation
        started.
      </p>
    );
  }

  return (
    <section className="rounded-container border border-dashed border-border bg-card p-8 text-center">
      <p className="text-base text-muted-foreground">
        No requests match these filters.
      </p>
      <button
        type="button"
        onClick={onClearFilters}
        className="mt-3 min-h-11 px-3 font-medium text-primary underline-offset-4 hover:underline"
      >
        Clear filters
      </button>
    </section>
  );
}

export function FeatureTableRows({
  result,
  hasFilters,
  variant,
  currentUserId,
  onClearFilters,
  onPageChange,
  onVote,
  onSaveStatus,
}: FeatureTableRowsProps) {
  if (result.items.length === 0 && result.total === 0) {
    return (
      <FeatureListEmpty
        hasFilters={hasFilters}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <>
      {result.items.length === 0 ? (
        <p className="rounded-container border border-border bg-card p-6 text-center text-muted-foreground">
          There are no requests on this page. Choose an earlier page.
        </p>
      ) : (
        <div
          className="overflow-x-auto rounded-container border border-border bg-card shadow-sm"
          tabIndex={0}
          aria-label="Feature request list, horizontally scrollable"
        >
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">
              Feature requests with author, votes, status, and actions
            </caption>
            <thead className="bg-muted/60 text-sm font-medium text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Feature request
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Votes
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  {variant === "admin" ? "Manage status" : "Vote"}
                </th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((feature) => (
                <FeatureRow
                  key={`${feature.id}:${feature.updatedAt}:${feature.votes}:${feature.hasVotedByMe}`}
                  feature={feature}
                  variant={variant}
                  currentUserId={currentUserId}
                  onVote={onVote}
                  onSaveStatus={onSaveStatus}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <FeaturePagination
        total={result.total}
        page={result.page}
        pageCount={result.pageCount}
        pageSize={result.pageSize}
        onPageChange={onPageChange}
      />
    </>
  );
}
