import { vi } from "vitest";
vi.mock("@/features/payment-methods/services/payment-method-actions", () => ({
  getAvailablePaymentMethodsAction: vi.fn().mockResolvedValue([
    {
      id: "a34b9dc6-135f-4bd0-9f25-43a9617c9e0a",
      name: "Cash",
      kind: "CASH",
    },
  ]),
}));
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render as testingRender } from "@testing-library/react";
import type { ReactElement } from "react";
export function render(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(
    ["payment-methods", "available"],
    [
      {
        id: "a34b9dc6-135f-4bd0-9f25-43a9617c9e0a",
        name: "Cash",
        kind: "CASH",
      },
    ],
  );
  return testingRender(element, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}
