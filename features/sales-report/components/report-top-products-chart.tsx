"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { SalesReport } from "../schemas/sales-report.schema";
import { count, peso, roundedPeso } from "../services/report-format";
import { ReportPanel, ReportPanelEmpty } from "./report-panel";

const config = {
  net_sales: { label: "Net sales", color: "var(--chart-2)" },
} satisfies ChartConfig;

const ROW_HEIGHT = 36;
const AXIS_WIDTH = 168;
const NAME_LENGTH = 21;
const RANK_WIDTH = 18;

type ProductRow = SalesReport["top_products"][number];

function shorten(name: string) {
  return name.length > NAME_LENGTH
    ? `${name.slice(0, NAME_LENGTH - 1).trimEnd()}…`
    : name;
}

/** One-line, left-aligned rank and name; the tooltip shows the full name. */
function ProductTick({
  y,
  index,
  payload,
}: {
  y?: number;
  index?: number;
  payload?: { value?: unknown };
}) {
  return (
    <g fontSize={12}>
      <text
        x={RANK_WIDTH}
        y={y}
        dy={4}
        textAnchor="end"
        className="fill-muted-foreground tabular-nums"
      >
        {(index ?? 0) + 1}.
      </text>
      <text
        x={RANK_WIDTH + 6}
        y={y}
        dy={4}
        textAnchor="start"
        className="fill-foreground"
      >
        {shorten(String(payload?.value ?? ""))}
      </text>
    </g>
  );
}

function TooltipLine({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex w-full justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </span>
  );
}

/** Best sellers ranked by net sales as horizontal bars. */
export function ReportTopProductsChart({ report }: { report: SalesReport }) {
  const rows = report.top_products;
  const data = rows.map((row) => ({ ...row, value: Number(row.net_sales) }));
  return (
    <ReportPanel id="report-products" title="Top products" aside="Net sales">
      {rows.length === 0 ? (
        <ReportPanelEmpty />
      ) : (
        <figure className="p-4">
          <ChartContainer
            config={config}
            aria-hidden="true"
            className="aspect-auto w-full"
            style={{ height: rows.length * ROW_HEIGHT }}
          >
            <BarChart
              data={data}
              layout="vertical"
              barCategoryGap={6}
              margin={{ top: 0, right: 72, bottom: 0, left: 0 }}
            >
              <YAxis
                dataKey="name"
                type="category"
                width={AXIS_WIDTH}
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={<ProductTick />}
              />
              <XAxis dataKey="value" type="number" hide />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.6 }}
                content={
                  <ChartTooltipContent
                    formatter={(_value, _name, item) => {
                      const row = item.payload as ProductRow;
                      return (
                        <span className="flex w-full flex-col gap-1">
                          <TooltipLine
                            label="Net sales"
                            value={peso(row.net_sales)}
                          />
                          <TooltipLine
                            label="Sold"
                            value={count(row.quantity)}
                          />
                          {report.show_costs && (
                            <TooltipLine
                              label="Gross profit"
                              value={peso(row.gross_profit)}
                            />
                          )}
                        </span>
                      );
                    }}
                  />
                }
              />
              <Bar
                dataKey="value"
                fill="var(--color-net_sales)"
                radius={4}
                maxBarSize={28}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="value"
                  position="right"
                  offset={8}
                  className="fill-foreground tabular-nums"
                  fontSize={12}
                  formatter={(value) => roundedPeso(Number(value))}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
          <figcaption className="sr-only">
            <ol>
              {rows.map((row) => (
                <li key={row.product_id}>
                  {row.name}: {peso(row.net_sales)}, {count(row.quantity)} sold
                  {report.show_costs && `, ${peso(row.gross_profit)} profit`}
                </li>
              ))}
            </ol>
          </figcaption>
        </figure>
      )}
    </ReportPanel>
  );
}
