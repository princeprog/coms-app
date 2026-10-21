export const dispatchesEndpoint = "/dispatches";
export const restockSuggestionsEndpoint = "/dispatches/restock-suggestions";
export const dispatchesRoute = "/dispatches";

export const dispatchStatuses = [
  "DRAFT",
  "IN_TRANSIT",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CLOSED_WITH_SHORTAGE",
] as const;

export const dispatchResolutionOutcomes = [
  "LOST",
  "NOT_LOADED",
  "SURPLUS",
] as const;
