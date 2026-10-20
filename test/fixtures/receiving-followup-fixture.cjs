// Synthetic UI scenarios only. Database behavior is verified by API integration tests.
function seedReceivingFollowup(state) {
  const pending = state.dispatches.filter(
    (d) => d.status === "IN_TRANSIT" && !d.counted_at,
  );
  pending.forEach((d, i) => {
    d.receive_by = new Date(
      Date.now() + (i % 2 ? 86400000 : -3600000),
    ).toISOString();
    d.receiving_status = i % 2 ? "AWAITING_COUNT" : "OVERDUE";
    d.late_counts = [];
    d.late_count_blockers = [];
  });
  const review = pending[1];
  if (review) {
    const approved = state.dailyReports.find((r) => r.status === "APPROVED");
    review.receiving_status = "REVIEW";
    review.late_counts = [
      {
        id: "a1000000-0000-4000-8000-000000000001",
        status: "PENDING",
        counted_by_user_id: "00000000-0000-4000-8000-0000000000cc",
        delivery_date: "2026-09-25",
        late_reason: "The delivery was counted but not submitted.",
        review_reason: null,
        created_at: new Date().toISOString(),
        reviewed_at: null,
        items: review.items.map((item) => ({
          dispatch_item_id: item.id,
          quantity: "4",
        })),
      },
    ];
    review.late_count_blockers = approved
      ? [
          {
            id: approved.id,
            business_date: approved.business_date,
            status: "APPROVED",
          },
        ]
      : [];
  }
  const report = state.dailyReports.find((r) =>
    ["DRAFT", "RETURNED"].includes(r.status),
  );
  if (report && pending[0])
    report.pending_deliveries = [
      {
        id: pending[0].id,
        dispatched_at: pending[0].dispatched_at,
        receive_by: pending[0].receive_by,
        receiving_status: "OVERDUE",
      },
    ];
}
module.exports = { seedReceivingFollowup };
