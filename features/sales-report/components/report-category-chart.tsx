"use client";

import { Label, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { SalesReport } from "../schemas/sales-report.schema";
import {
  categorySlices,
  CATEGORY_SLICE_LIMIT,
  percent,
  peso,
  roundedPeso,
  type CategorySlice,
} from "../services/report-format";
import { ReportPanel, ReportPanelEmpty } from "./report-panel";

// Distinct hues so neighbouring slices stay apart; slate marks "Other".
const palette = [
  { light: "oklch(0.606 0.25 292.717)", dark: "oklch(0.702 0.183 293.541)" },
  { light: "oklch(0.685 0.169 237.323)", dark: "oklch(0.746 0.16 232.661)" },
  { light: "oklch(0.769 0.188 70.08)", dark: "oklch(0.828 0.189 84.429)" },
  { light: "oklch(0.696 0.17 162.48)", dark: "oklch(0.765 0.177 163.223)" },
  { light: "oklch(0.645 0.246 16.439)", dark: "oklch(0.712 0.194 13.428)" },
  { light: "oklch(0.585 0.233 277.117)", dark: "oklch(0.673 0.182 276.935)" },
  { light: "oklch(0.768 0.233 130.85)", dark: "oklch(0.841 0.238 128.85)" },
  { light: "oklch(0.704 0.14 182.503)", dark: "oklch(0.777 0.152 181.912)" },
] as const;
const other = {
  light: "oklch(0.704 0.04 256.788)",
  dark: "oklch(0.554 0.046 257.417)",
};
const CHART_ID = "report-categories";

function chartConfig(slices: CategorySlice[]) {
  return Object.fromEntries(
    slices.map((slice, index) => [
      slice.key,
      {
        label: slice.name,
        theme: slice.other ? other : palette[index % CATEGORY_SLICE_LIMIT],
      },
    ]),
  ) satisfies ChartConfig;
}

/** Each category's share of net sales as a donut with a legend. */
export function ReportCategoryChart({ report }: { report: SalesReport }) {
  const slices = categorySlices(report.by_category);
  const config = chartConfig(slices);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const data = slices.map((slice) => ({
    ...slice,
    fill: `var(--color-${slice.key})`,
  }));
  return (
    <ReportPanel id="report-categories" title="Categories" aside="Net sales">
      {slices.length === 0 ? (
        <ReportPanelEmpty />
      ) : (
        // Shares the chart's colour scope so legend swatches match the slices.
        <div
          data-chart={`chart-${CHART_ID}`}
          className="grid flex-1 items-center gap-6 p-4 sm:grid-cols-[11rem_minmax(0,1fr)]"
        >
          <ChartContainer
            id={CHART_ID}
            config={config}
            aria-hidden="true"
            className="mx-auto aspect-square w-full max-w-44"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    nameKey="key"
                    formatter={(_value, _name, item) => {
                      const slice = item.payload as CategorySlice;
                      return (
                        <span className="flex w-full items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="size-2.5 shrink-0 rounded-sm"
                            style={{ background: `var(--color-${slice.key})` }}
                          />
                          <span className="whitespace-nowrap text-muted-foreground">
                            {slice.name}
                          </span>
                          <span className="ml-auto pl-3 font-medium tabular-nums">
                            {peso(slice.netSales)}
                          </span>
                        </span>
                      );
                    }}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="key"
                innerRadius="64%"
                outerRadius="100%"
                stroke="var(--card)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox))
                      return null;
                    const cx = viewBox.cx ?? 0;
                    const cy = viewBox.cy ?? 0;
                    return (
                      <text x={cx} y={cy} textAnchor="middle">
                        <tspan
                          x={cx}
                          y={cy - 2}
                          className="fill-foreground text-base font-semibold tabular-nums"
                        >
                          {roundedPeso(total)}
                        </tspan>
                        <tspan
                          x={cx}
                          y={cy + 16}
                          className="fill-muted-foreground text-xs"
                        >
                          Net sales
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <ul aria-label="Categories" className="flex min-w-0 flex-col gap-2.5">
            {slices.map((slice) => (
              <li key={slice.key} className="flex items-center gap-2.5 text-sm">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ background: `var(--color-${slice.key})` }}
                />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {slice.name}
                </span>
                <span className="w-12 shrink-0 text-right text-muted-foreground tabular-nums">
                  {percent(slice.share)}
                </span>
                <span className="w-24 shrink-0 text-right tabular-nums">
                  {peso(slice.netSales)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ReportPanel>
  );
}
