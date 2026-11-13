import {
  FEATURE_STATUS_LABELS,
  type FeatureItem,
} from "@featurevote/shared/contracts";

type FeatureCardProps = {
  feature: FeatureItem;
  busy: boolean;
  onToggleVote: (feature: FeatureItem) => void;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

export function FeatureCard({ feature, busy, onToggleVote }: FeatureCardProps) {
  return (
    <article className={`feature-card status-${feature.status.toLowerCase()}`}>
      <div className="feature-card-heading">
        <h2 className="feature-title">{feature.title}</h2>
        <span
          className={`status-badge status-badge-${feature.status.toLowerCase()}`}
        >
          {FEATURE_STATUS_LABELS[feature.status]}
        </span>
      </div>
      <p className="feature-description">{feature.description}</p>
      <div className="feature-card-footer">
        <div className="feature-meta">
          <span className="feature-author">{feature.author.name}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={feature.createdAt}>
            {dateFormatter.format(new Date(feature.createdAt))}
          </time>
        </div>
        <button
          className={`vote-button${feature.hasVoted ? " is-voted" : ""}`}
          type="button"
          aria-pressed={feature.hasVoted}
          aria-label={`${feature.hasVoted ? "Remove vote from" : "Vote for"} ${feature.title}; ${feature.voteCount} votes`}
          disabled={busy}
          onClick={() => onToggleVote(feature)}
        >
          <span aria-hidden="true">↑</span>
          <span>{feature.voteCount}</span>
          <span className="vote-word">
            {feature.hasVoted ? "Voted" : "Vote"}
          </span>
        </button>
      </div>
    </article>
  );
}
