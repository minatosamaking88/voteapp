import type { FeatureStatus } from "../../shared/contracts";
import { statusLabel } from "./status-label";

const statusStyles: Record<FeatureStatus, string> = {
  PLANNED: "bg-info/10 text-info",
  IN_PROGRESS: "bg-warning/10 text-warning",
  SHIPPED: "bg-success/10 text-success",
};

export function StatusBadge({ status }: { status: FeatureStatus }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-3 text-sm font-medium ${statusStyles[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}
