import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { createFeatureSchema, type FeatureCard } from "../../shared/contracts";
import { useAuth } from "../auth/auth-context";
import { FeatureFilters } from "../features/feature-filters";
import { FeatureTable } from "../features/feature-table";
import { useFeatureList } from "../features/use-feature-list";
import { apiRequest, errorMessage } from "../lib/api";

export function BoardPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, loading, error, refresh } = useFeatureList();
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const hasFilters = Boolean(
    searchParams.get("q") || searchParams.get("status"),
  );

  async function submitFeature(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFeedback("");
    const parsed = createFeatureSchema.safeParse({ title });
    if (!parsed.success) {
      setFormError(
        parsed.error.issues[0]?.message ?? "Enter a feature request title.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest<FeatureCard>("/api/features", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      setTitle("");
      setFeedback("Your request is on the board.");
      refresh();
    } catch (error) {
      setFormError(
        `Could not add your request: ${errorMessage(error, "Try again.")} Your text is still here.`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function vote(featureId: string): Promise<FeatureCard> {
    const updated = await apiRequest<FeatureCard>(
      `/api/features/${featureId}/votes`,
      { method: "POST" },
    );
    refresh();
    return updated;
  }

  function changePage(page: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page));
    setSearchParams(next);
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="motion-safe:animate-rise flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Feature requests
        </h1>
        <p className="max-w-prose text-base text-muted-foreground">
          Share ideas, support requests that matter, and follow their progress.
        </p>
      </header>

      <form
        onSubmit={submitFeature}
        className="motion-safe:animate-rise rounded-container border border-border bg-card p-6 shadow-sm sm:p-6"
      >
        <label
          htmlFor="feature-title"
          className="block text-base font-semibold text-card-foreground"
        >
          Suggest a feature
        </label>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell the team what would make your work easier.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            id="feature-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={160}
            required
            placeholder="What would you like to see?"
            className="min-h-12 min-w-0 flex-1 rounded-control border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={submitting}
            className="min-h-12 rounded-control bg-primary px-6 font-semibold text-primary-foreground transition hover:brightness-95 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? "Adding…" : "Add request"}
          </button>
        </div>
        {formError && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {formError}
          </p>
        )}
        {feedback && (
          <p className="mt-3 text-sm text-success" role="status">
            {feedback}
          </p>
        )}
      </form>

      <div className="space-y-4">
        <FeatureFilters hasFilters={hasFilters} />
        <FeatureTable
          result={data}
          loading={loading}
          error={error}
          hasFilters={hasFilters}
          variant="board"
          currentUserId={user?.id ?? null}
          onRetry={refresh}
          onClearFilters={() => setSearchParams({}, { replace: true })}
          onPageChange={changePage}
          onVote={vote}
          onSaveStatus={null}
        />
      </div>
    </section>
  );
}
