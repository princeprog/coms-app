import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BranchProfitRow } from "../schemas/cost.schema";
import { formatPercent, formatPeso } from "../services/cost-format";

export function ProfitSummary({ totals }: { totals: BranchProfitRow }) {
  const cards = [
    { label: "Net sales", value: formatPeso(totals.net_sales) },
    { label: "Food cost", value: formatPeso(totals.food_cost) },
    { label: "Gross profit", value: formatPeso(totals.gross_profit) },
    { label: "Food cost %", value: formatPercent(totals.food_cost_percent) },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} size="sm">
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">
            {card.value}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
