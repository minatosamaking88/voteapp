import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { FeatureCard, FeatureStatus } from "../../shared/contracts";
import { FeatureFilters } from "../features/feature-filters";
import { FeatureTable } from "../features/feature-table";
import { useFeatureList } from "../features/use-feature-list";
import { apiRequest, errorMessage } from "../lib/api";
import { SummaryCards } from "../admin/summary-cards";
import { useAdminSummary } from "../admin/use-admin-summary";
import { useAuth } from "../auth/auth-context";
import { statusLabel } from "../features/status-label";

export function AdminPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const featureList = useFeatureList();
  const summary = useAdminSummary();
  const [feedback, setFeedback] = useState("");
  const hasFilters = Boolean(
    searchParams.get("q") || searchParams.get("status"),
  );

  async function saveStatus(
    featureId: string,
    status: FeatureStatus,
  ): Promise<FeatureCard> {
    setFeedback("");
    try {
      const updated = await apiRequest<FeatureCard>(
        `/api/admin/features/${featureId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );
      setFeedback(
        `Saved “${updated.title}” as ${statusLabel(updated.status)}.`,
      );
      featureList.refresh();
      summary.refresh();
      return updated;
    } catch (error) {
      throw new Error(errorMessage(error, "Try again."), { cause: error });
    }
  }

  function changePage(page: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page));
    setSearchParams(next);
  }

  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="motion-safe:animate-rise space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Feature status
        </h1>
        <p className="max-w-prose text-base text-muted-foreground">
          Keep the board current so requesters can see what is planned,
          underway, and shipped.
        </p>
      </header>

      <div className="space-y-3">
        {summary.error && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-destructive/40 bg-card px-4 py-3"
            role="alert"
          >
            <p className="text-sm text-destructive">
              Could not load the summary: {summary.error}
            </p>
            <button
              type="button"
              onClick={summary.refresh}
              className="min-h-11 px-3 font-semibold text-primary underline-offset-4 hover:underline"
            >
              Retry
            </button>
          </div>
        )}
        <SummaryCards summary={summary.data} loading={summary.loading} />
      </div>

      <section className="space-y-4" aria-labelledby="admin-feature-list-title">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2
            id="admin-feature-list-title"
            className="font-heading text-xl font-semibold text-foreground"
          >
            All feature requests
          </h2>
          <p className="text-sm text-muted-foreground">
            Signed in as {user?.name}
          </p>
        </div>
        {feedback && (
          <p
            className="rounded-control border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
            role="status"
          >
            {feedback}
          </p>
        )}
        <FeatureFilters hasFilters={hasFilters} />
        <FeatureTable
          result={featureList.data}
          loading={featureList.loading}
          error={featureList.error}
          hasFilters={hasFilters}
          variant="admin"
          currentUserId={user?.id ?? null}
          onRetry={featureList.refresh}
          onClearFilters={() => setSearchParams({}, { replace: true })}
          onPageChange={changePage}
          onVote={null}
          onSaveStatus={saveStatus}
        />
      </section>
    </section>
  );
}
