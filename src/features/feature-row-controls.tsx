import { useState } from "react";
import type { FeatureCard, FeatureStatus } from "../../shared/contracts";
import { errorMessage } from "../lib/api";
import { statusLabel } from "./status-label";
import { FeatureStatusControl } from "./feature-status-control";
import { FeatureVoteButton } from "./feature-vote-button";

type FeatureRowControlsProps = {
  feature: FeatureCard;
  variant: "board" | "admin";
  ownFeature: boolean;
  savedStatus: FeatureStatus;
  hasVoted: boolean;
  onVote: ((featureId: string) => Promise<FeatureCard>) | null;
  onSaveStatus:
    ((featureId: string, status: FeatureStatus) => Promise<FeatureCard>) | null;
  onStatusSaved: (status: FeatureStatus) => void;
  onVoteSaved: (votes: number, hasVoted: boolean) => void;
};

export function FeatureRowControls({
  feature,
  variant,
  ownFeature,
  savedStatus,
  hasVoted,
  onVote,
  onSaveStatus,
  onStatusSaved,
  onVoteSaved,
}: FeatureRowControlsProps) {
  const [draftStatus, setDraftStatus] = useState(savedStatus);
  const [saving, setSaving] = useState(false);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  async function saveStatus() {
    if (!onSaveStatus || draftStatus === savedStatus || saving) return;
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      const updatedFeature = await onSaveStatus(feature.id, draftStatus);
      onStatusSaved(updatedFeature.status);
      setDraftStatus(updatedFeature.status);
      setFeedback(`Saved as ${statusLabel(updatedFeature.status)}.`);
    } catch (saveError) {
      setDraftStatus(savedStatus);
      setError(
        `Could not save this status: ${errorMessage(saveError, "Try again.")} Your last saved status is unchanged.`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function castVote() {
    if (!onVote || ownFeature || hasVoted || voting) return;
    setVoting(true);
    setError("");
    try {
      const updatedFeature = await onVote(feature.id);
      onVoteSaved(updatedFeature.votes, updatedFeature.hasVotedByMe);
    } catch (voteError) {
      setError(
        `Could not record your vote: ${errorMessage(voteError, "Try again.")}`,
      );
    } finally {
      setVoting(false);
    }
  }

  return (
    <td className="min-w-48 px-4 py-3">
      {variant === "admin" ? (
        <FeatureStatusControl
          savedStatus={savedStatus}
          draftStatus={draftStatus}
          saving={saving}
          onStatusChange={(status) => {
            setDraftStatus(status);
            setError("");
            setFeedback("");
          }}
          onSave={saveStatus}
        />
      ) : (
        <FeatureVoteButton
          title={feature.title}
          ownFeature={ownFeature}
          hasVoted={hasVoted}
          voting={voting}
          onVote={castVote}
        />
      )}
      {error && (
        <p className="mt-2 max-w-sm text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {feedback && (
        <p className="mt-2 text-sm text-success" role="status">
          {feedback}
        </p>
      )}
    </td>
  );
}
