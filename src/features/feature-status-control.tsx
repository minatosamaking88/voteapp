import {
  FEATURE_STATUSES,
  featureStatusSchema,
  type FeatureStatus,
} from "../../shared/contracts";
import { statusLabel } from "./status-label";

type FeatureStatusControlProps = {
  savedStatus: FeatureStatus;
  draftStatus: FeatureStatus;
  saving: boolean;
  onStatusChange: (status: FeatureStatus) => void;
  onSave: () => void;
};

export function FeatureStatusControl({
  savedStatus,
  draftStatus,
  saving,
  onStatusChange,
  onSave,
}: FeatureStatusControlProps) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="grid flex-1 gap-1 text-sm text-muted-foreground">
        Change status
        <select
          value={draftStatus}
          onChange={(event) => {
            const parsedStatus = featureStatusSchema.safeParse(
              event.target.value,
            );
            if (parsedStatus.success) onStatusChange(parsedStatus.data);
          }}
          disabled={saving}
          className="min-h-11 w-full rounded-control border border-border bg-card px-2 text-base text-card-foreground disabled:opacity-60"
        >
          {FEATURE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || draftStatus === savedStatus}
        className="min-h-11 rounded-control bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
