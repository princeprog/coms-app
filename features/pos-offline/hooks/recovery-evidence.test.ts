import { describe, expect, it } from "vitest";
import { recoveryEvidence } from "./recovery-evidence";
import { id, recoveryFixture } from "./offline-ui-fixture";
describe("manager recovery evidence", () => {
  it("uses the export watermark and includes already acknowledged envelopes", () => {
    const result = recoveryEvidence(recoveryFixture(), id(2));
    expect(result.final_sequence).toBe(1);
    expect(result.transaction_ids).toEqual([id(10)]);
    expect(result.transactions[0].total_amount).toBe("20.5");
  });
  it("rejects an empty, truncated or wrong-branch recovery export", () => {
    const recovery = recoveryFixture();
    expect(() =>
      recoveryEvidence({ ...recovery, final_sequence: 0, records: [] }, id(2)),
    ).toThrow(/complete/);
    expect(() =>
      recoveryEvidence({ ...recovery, final_sequence: 2 }, id(2)),
    ).toThrow(/complete/);
    expect(() => recoveryEvidence(recovery, id(99))).toThrow(/branch/);
    expect(() =>
      recoveryEvidence(
        {
          ...recovery,
          cart: {
            ...recovery.cart,
            items: [{ product_id: id(7), quantity: "1" }],
          },
        },
        id(2),
      ),
    ).toThrow(/unfinished/);
  });
  it("rejects modified contents and duplicate IDs", () => {
    const recovery = recoveryFixture();
    recovery.records[0].envelope.total_amount = "0";
    expect(() => recoveryEvidence(recovery, id(2))).toThrow();
    expect(() =>
      recoveryEvidence(
        {
          ...recoveryFixture(),
          records: [recoveryFixture().records[0], recoveryFixture().records[0]],
        },
        id(2),
      ),
    ).toThrow();
  });
});
