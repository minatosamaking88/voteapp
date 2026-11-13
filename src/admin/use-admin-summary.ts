import { useCallback, useEffect, useState } from "react";
import type { AdminSummaryResponse } from "../../shared/contracts";
import { apiRequest, errorMessage } from "../lib/api";

type SummarySnapshot = {
  requestVersion: number;
  data: AdminSummaryResponse | undefined;
  error: string | null;
};

export function useAdminSummary() {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [snapshot, setSnapshot] = useState<SummarySnapshot>({
    requestVersion: -1,
    data: undefined,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<AdminSummaryResponse>("/api/admin/summary", {
      signal: controller.signal,
    })
      .then((data) =>
        setSnapshot({ requestVersion: refreshVersion, data, error: null }),
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSnapshot((previous) => ({
          requestVersion: refreshVersion,
          data: previous.data,
          error: errorMessage(error, "Could not load the board summary."),
        }));
      });
    return () => controller.abort();
  }, [refreshVersion]);

  const refresh = useCallback(
    () => setRefreshVersion((version) => version + 1),
    [],
  );
  return {
    data: snapshot.data,
    loading: snapshot.requestVersion !== refreshVersion,
    error: snapshot.requestVersion === refreshVersion ? snapshot.error : null,
    refresh,
  };
}
