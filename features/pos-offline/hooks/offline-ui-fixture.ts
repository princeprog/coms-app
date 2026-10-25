import type {
  OfflineLocalState,
  OfflineRecovery,
} from "../services/offline-types";
export const id = (number: number) =>
  `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
export function registerFixture(): OfflineLocalState {
  return {
    session: {
      id: id(1),
      branch_id: id(2),
      cashier_id: id(3),
      shift_id: id(4),
      device_id: id(5),
      issued_at: "2026-10-26T01:00:00.000Z",
      server_time: "2026-10-26T01:00:00.000Z",
      cutoff_at: "2026-10-26T10:00:00.000Z",
      business_date: "2026-10-26",
    },
    snapshot: {
      id: id(6),
      products: [
        {
          id: id(7),
          name: "Chicken",
          sku: null,
          category_id: id(8),
          category_name: "Meals",
          price: "10.25",
          price_revision: 1,
          supports_dine_in: true,
          supports_takeaway: true,
        },
      ],
      cash_payment_method: { id: id(9), name: "Cash" },
      branch: {
        id: id(2),
        name: "Banilad",
        supports_dine_in: true,
        supports_takeaway: true,
      },
    },
    cart: {
      revision: 1,
      service_type: "DINE_IN",
      items: [{ product_id: id(7), quantity: "2" }],
    },
    snapshots: [],
    selling_enabled: true,
    records: [],
    next_sequence: 1,
    sealed: false,
    clock: {
      offset_ms: 0,
      last_wall_ms: Date.parse("2026-10-26T01:00:00.000Z"),
      last_server_ms: Date.parse("2026-10-26T01:00:00.000Z"),
      rollback_detected: false,
    },
  };
}
export function recoveryFixture(): OfflineRecovery {
  const state = registerFixture();
  state.snapshots = [state.snapshot];
  return {
    schema_version: 1,
    final_sequence: 1,
    scope: {
      branch_id: id(2),
      cashier_id: id(3),
      shift_id: id(4),
      device_id: id(5),
    },
    session: state.session,
    snapshot: state.snapshot,
    snapshots: state.snapshots,
    cart: { ...state.cart, items: [] },
    records: [
      {
        status: "ACKNOWLEDGED",
        envelope: {
          id: id(10),
          session_id: id(1),
          device_id: id(5),
          shift_id: id(4),
          sequence: 1,
          snapshot_id: id(6),
          captured_at: "2026-10-26T02:00:00.000Z",
          service_type: "DINE_IN",
          items: [
            {
              product_id: id(7),
              quantity: "2",
              unit_price: "10.25",
              price_revision: 1,
            },
          ],
          cash_tendered: "30",
          total_amount: "20.5",
        },
      },
    ],
  };
}
