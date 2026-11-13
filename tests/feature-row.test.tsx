/** @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FeatureCard } from "../shared/contracts.js";
import { FeatureRow } from "../src/features/feature-row.js";

afterEach(cleanup);

const feature: FeatureCard = {
  id: "7c12c1b2-9ea5-4eb3-a248-b7dd04061001",
  title: "Keyboard shortcuts for common actions",
  author: { id: "author-1", name: "Morgan Lee" },
  votes: 4,
  status: "PLANNED",
  createdAt: "2025-03-01T12:00:00.000Z",
  updatedAt: "2025-03-01T12:00:00.000Z",
  hasVotedByMe: false,
};

function renderAdminRow(
  onSaveStatus: (
    featureId: string,
    status: FeatureCard["status"],
  ) => Promise<FeatureCard>,
) {
  return render(
    <div className="overflow-x-auto">
      <table>
        <caption className="sr-only">Admin feature status test row</caption>
        <tbody>
          <FeatureRow
            feature={feature}
            variant="admin"
            currentUserId="admin-1"
            onVote={null}
            onSaveStatus={onSaveStatus}
          />
        </tbody>
      </table>
    </div>,
  );
}

describe("Admin feature row status changes", () => {
  it("shows the saved status and success feedback after the API response", async () => {
    const saveStatus = vi.fn(
      async (_featureId: string, status: FeatureCard["status"]) => ({
        ...feature,
        status,
        updatedAt: "2025-03-02T12:00:00.000Z",
      }),
    );
    renderAdminRow(saveStatus);
    const selector = screen.getByLabelText(
      "Change status",
    ) as HTMLSelectElement;

    fireEvent.change(selector, { target: { value: "IN_PROGRESS" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(saveStatus).toHaveBeenCalledWith(feature.id, "IN_PROGRESS"),
    );
    expect((await screen.findByRole("status")).textContent).toContain(
      "Saved as In Progress.",
    );
    expect(screen.getAllByText("In Progress").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Save" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("preserves the last saved status and explains a failed save", async () => {
    const saveStatus = vi
      .fn()
      .mockRejectedValue(new Error("Network is unavailable"));
    renderAdminRow(saveStatus);
    const selector = screen.getByLabelText(
      "Change status",
    ) as HTMLSelectElement;

    fireEvent.change(selector, { target: { value: "SHIPPED" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const error = await screen.findByRole("alert");
    expect(error.textContent).toContain("Network is unavailable");
    expect(selector.value).toBe("PLANNED");
    expect(
      screen.getByRole("button", { name: "Save" }).hasAttribute("disabled"),
    ).toBe(true);
  });
});
