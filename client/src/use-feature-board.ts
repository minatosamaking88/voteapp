import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_FEATURE_PAGE_SIZE,
  type FeatureItem,
  type FeatureListResponse,
  type VoteResponse,
} from "@featurevote/shared/contracts";
import { ApiClientError, requestJson } from "./api";

type BoardData = FeatureListResponse & {
  loading: boolean;
  error: string;
};

export function useFeatureBoard(queryString: string) {
  const [board, setBoard] = useState<BoardData>({
    items: [],
    total: 0,
    page: 1,
    pageSize: DEFAULT_FEATURE_PAGE_SIZE,
    loading: true,
    error: "",
  });
  const [activity, setActivity] = useState({
    actionMessage: "",
    pendingIds: new Set<string>(),
  });

  const requestFeatures = useCallback(
    (signal?: AbortSignal) => {
      const suffix = queryString ? `?${queryString}` : "";
      return requestJson<FeatureListResponse>(`/api/features${suffix}`, {
        ...(signal ? { signal } : {}),
      });
    },
    [queryString],
  );

  const applyFeatures = useCallback((result: FeatureListResponse) => {
    setBoard((current) => ({
      ...current,
      items: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      error: "",
    }));
  }, []);

  const handleLoadError = useCallback(
    (loadError: unknown, signal?: AbortSignal) => {
      if (signal?.aborted) return;
      if (loadError instanceof ApiClientError && loadError.status === 401) {
        window.location.replace("/login");
        return;
      }
      setBoard((current) => ({
        ...current,
        error:
          loadError instanceof ApiClientError
            ? loadError.message
            : "The feature board could not be loaded. Check your connection and retry.",
      }));
    },
    [],
  );

  const loadFeatures = useCallback(
    async (showLoading = true) => {
      if (showLoading) setBoard((current) => ({ ...current, loading: true }));
      try {
        applyFeatures(await requestFeatures());
      } catch (loadError) {
        handleLoadError(loadError);
      } finally {
        if (showLoading)
          setBoard((current) => ({ ...current, loading: false }));
      }
    },
    [applyFeatures, handleLoadError, requestFeatures],
  );

  useEffect(() => {
    const controller = new AbortController();
    requestFeatures(controller.signal)
      .then(applyFeatures)
      .catch((loadError: unknown) =>
        handleLoadError(loadError, controller.signal),
      )
      .finally(() => {
        if (!controller.signal.aborted)
          setBoard((current) => ({ ...current, loading: false }));
      });
    return () => controller.abort();
  }, [applyFeatures, handleLoadError, requestFeatures]);

  const refresh = useCallback(() => loadFeatures(), [loadFeatures]);

  const toggleVote = useCallback(
    async (feature: FeatureItem) => {
      setActivity((current) => ({
        ...current,
        pendingIds: new Set(current.pendingIds).add(feature.id),
        actionMessage: "",
      }));
      try {
        const method = feature.hasVoted ? "DELETE" : "PUT";
        const vote = await requestJson<VoteResponse>(
          `/api/features/${feature.id}/vote`,
          { method },
        );
        setBoard((current) => ({
          ...current,
          items: current.items.map((item) =>
            item.id === vote.featureId
              ? { ...item, voteCount: vote.voteCount, hasVoted: vote.hasVoted }
              : item,
          ),
        }));
        setActivity((current) => ({
          ...current,
          actionMessage: vote.hasVoted
            ? "Your vote was added."
            : "Your vote was removed.",
        }));
        await loadFeatures(false);
      } catch (voteError) {
        setBoard((current) => ({
          ...current,
          error:
            voteError instanceof ApiClientError
              ? voteError.message
              : "Your vote was not changed. Check your connection and try again.",
        }));
      } finally {
        setActivity((current) => {
          const pendingIds = new Set(current.pendingIds);
          pendingIds.delete(feature.id);
          return { ...current, pendingIds };
        });
      }
    },
    [loadFeatures],
  );

  return { ...board, ...activity, refresh, toggleVote };
}
