import type {
  FeatureCard,
  FeatureListResponse,
  FeatureStatus,
} from "../../shared/contracts";
import {
  FeatureListError,
  FeatureListLoading,
  FeatureListRefreshFeedback,
} from "./feature-list-feedback";
import { FeatureTableRows } from "./feature-table-rows";

type FeatureTableProps = {
  result: FeatureListResponse | undefined;
  loading: boolean;
  error: string | null;
  hasFilters: boolean;
  variant: "board" | "admin";
  currentUserId: string | null;
  onRetry: () => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onVote: ((featureId: string) => Promise<FeatureCard>) | null;
  onSaveStatus:
    ((featureId: string, status: FeatureStatus) => Promise<FeatureCard>) | null;
};

export function FeatureTable({
  result,
  loading,
  error,
  hasFilters,
  variant,
  currentUserId,
  onRetry,
  onClearFilters,
  onPageChange,
  onVote,
  onSaveStatus,
}: FeatureTableProps) {
  if (loading && !result) return <FeatureListLoading />;

  if (error && !result)
    return <FeatureListError message={error} onRetry={onRetry} />;
  if (!result) return null;

  return (
    <div className="space-y-4">
      <FeatureListRefreshFeedback
        error={error}
        loading={loading}
        onRetry={onRetry}
      />
      <FeatureTableRows
        result={result}
        hasFilters={hasFilters}
        variant={variant}
        currentUserId={currentUserId}
        onClearFilters={onClearFilters}
        onPageChange={onPageChange}
        onVote={onVote}
        onSaveStatus={onSaveStatus}
      />
    </div>
  );
}
