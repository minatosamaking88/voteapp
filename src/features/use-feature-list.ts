import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { FeatureListResponse } from "../../shared/contracts";
import { apiRequest, errorMessage } from "../lib/api";

type ListSnapshot = {
  requestKey: string;
  data: FeatureListResponse | undefined;
  error: string | null;
};

export function useFeatureList() {
  const [searchParams] = useSearchParams();
  const query = searchParams.toString();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const requestKey = `${query}:${refreshVersion}`;
  const [snapshot, setSnapshot] = useState<ListSnapshot>({
    requestKey: "",
    data: undefined,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const path = query ? `/api/features?${query}` : "/api/features";
    apiRequest<FeatureListResponse>(path, { signal: controller.signal })
      .then((data) => setSnapshot({ requestKey, data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSnapshot((previous) => ({
          requestKey,
          data: previous.data,
          error: errorMessage(error, "Could not load requests. Try again."),
        }));
      });
    return () => controller.abort();
  }, [query, requestKey]);

  const refresh = useCallback(
    () => setRefreshVersion((version) => version + 1),
    [],
  );
  return {
    data: snapshot.data,
    loading: snapshot.requestKey !== requestKey,
    error: snapshot.requestKey === requestKey ? snapshot.error : null,
    refresh,
  };
}
