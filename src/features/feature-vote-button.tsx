type FeatureVoteButtonProps = {
  title: string;
  ownFeature: boolean;
  hasVoted: boolean;
  voting: boolean;
  onVote: () => void;
};

export function FeatureVoteButton({
  title,
  ownFeature,
  hasVoted,
  voting,
  onVote,
}: FeatureVoteButtonProps) {
  return (
    <button
      type="button"
      onClick={onVote}
      disabled={ownFeature || hasVoted || voting}
      aria-label={`Upvote ${title}`}
      className="min-h-11 min-w-24 rounded-control border border-border px-3 text-sm font-semibold text-foreground transition hover:bg-muted active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
    >
      {voting
        ? "Voting…"
        : hasVoted
          ? "Voted"
          : ownFeature
            ? "Your request"
            : "Upvote"}
    </button>
  );
}
