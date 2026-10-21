import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type ReportColumn = { header: string; numeric?: boolean };

/** A titled read-only table for one report breakdown. */
export function ReportTable({
  id,
  title,
  columns,
  rows,
  className,
}: {
  id: string;
  title: string;
  columns: ReportColumn[];
  rows: { key: string; cells: string[] }[];
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn("min-w-0 rounded-xl border", className)}
    >
      <h2 id={id} className="border-b px-4 py-3 font-semibold">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          No sales in this period.
        </p>
      ) : (
        <Table
          aria-labelledby={id}
          containerProps={{
            role: "region",
            "aria-label": `${title} table`,
            tabIndex: 0,
          }}
        >
          <TableHeader className="bg-muted/40">
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={column.header}
                  scope="col"
                  className={cn(
                    index === 0 && "pl-4",
                    column.numeric && "text-right",
                    index === columns.length - 1 && "pr-4",
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                {row.cells.map((cell, index) => (
                  <TableCell
                    key={index}
                    className={cn(
                      index === 0 && "pl-4 font-medium whitespace-normal",
                      columns[index]?.numeric && "text-right tabular-nums",
                      index === row.cells.length - 1 && "pr-4",
                    )}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
