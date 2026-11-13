import { useState } from "react";
import type { FeatureCard, FeatureStatus } from "../../shared/contracts";
import { StatusBadge } from "./status-badge";
import { FeatureRowControls } from "./feature-row-controls";

type FeatureRowProps = {
  feature: FeatureCard;
  variant: "board" | "admin";
  currentUserId: string | null;
  onVote: ((featureId: string) => Promise<FeatureCard>) | null;
  onSaveStatus:
    ((featureId: string, status: FeatureStatus) => Promise<FeatureCard>) | null;
};

const submittedDate = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function FeatureRow({
  feature,
  variant,
  currentUserId,
  onVote,
  onSaveStatus,
}: FeatureRowProps) {
  const [savedStatus, setSavedStatus] = useState(feature.status);
  const [displayVotes, setDisplayVotes] = useState(feature.votes);
  const [hasVoted, setHasVoted] = useState(feature.hasVotedByMe);
  const ownFeature = feature.author.id === currentUserId;

  return (
    <tr className="border-t border-border align-top">
      <th
        scope="row"
        className="min-w-64 px-4 py-4 text-left font-medium text-card-foreground"
      >
        <span className="block max-w-xl text-base leading-6">
          {feature.title}
        </span>
        <span className="mt-1 block text-sm font-normal text-muted-foreground">
          {feature.author.name} ·{" "}
          {submittedDate.format(new Date(feature.createdAt))}
        </span>
      </th>
      <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums text-card-foreground">
        {displayVotes}
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <StatusBadge status={savedStatus} />
      </td>
      <FeatureRowControls
        feature={feature}
        variant={variant}
        ownFeature={ownFeature}
        savedStatus={savedStatus}
        hasVoted={hasVoted}
        onVote={onVote}
        onSaveStatus={onSaveStatus}
        onStatusSaved={setSavedStatus}
        onVoteSaved={(votes, voted) => {
          setDisplayVotes(votes);
          setHasVoted(voted);
        }}
      />
    </tr>
  );
}
