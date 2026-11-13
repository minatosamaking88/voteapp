import type { FeatureStatus } from "../../shared/contracts";

const statusLabels: Record<FeatureStatus, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  SHIPPED: "Shipped",
};

export function statusLabel(status: FeatureStatus): string {
  return statusLabels[status];
}
