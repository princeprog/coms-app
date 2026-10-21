import { count, peso } from "@/lib/metric-format";
import type { DashboardToday } from "../schemas/dashboard-today.schema";

/** Today's best sellers by net sales. */
export function TopProductsToday({
  products,
}: {
  products: DashboardToday["top_products_today"];
}) {
  const top = Math.max(
    ...products.map((product) => Number(product.net_sales)),
    0,
  );
  return (
    <section
      aria-labelledby="dashboard-top"
      className="flex min-w-0 flex-col rounded-xl border bg-card"
    >
      <h2 id="dashboard-top" className="border-b px-4 py-3 font-semibold">
        Top products today
      </h2>
      {products.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          No sales yet today.
        </p>
      ) : (
        <ul aria-label="Top products today" className="flex flex-col gap-3 p-4">
          {products.map((product, index) => (
            <li key={product.product_id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium">
                  {index + 1}. {product.name}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {count(product.quantity)} sold
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">
                  {peso(product.net_sales)}
                </span>
              </div>
              <div
                aria-hidden="true"
                className="h-1.5 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full w-full origin-left rounded-full bg-orange-500 transition-transform duration-300 ease-out-quint motion-reduce:transition-none dark:bg-orange-400"
                  style={{
                    transform: `scaleX(${top ? Number(product.net_sales) / top : 0})`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
