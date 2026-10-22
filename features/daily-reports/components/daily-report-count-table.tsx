import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DailyReportCountRow } from "./daily-report-count-row";
import { rowState, type CountViewProps } from "./daily-report-count-views";

export function DailyReportCountTable(props: CountViewProps) {
  return (
    <div className="hidden min-w-0 xl:block">
      <Table
        aria-label="Stock counts"
        className="table-fixed"
        containerProps={{ className: "min-w-0" }}
      >
        <colgroup>
          <col />
          <col className="w-32" />
          <col className="w-40" />
          <col className="w-32" />
          <col className="w-36" />
          <col className="w-32" />
          <col className="w-14" />
        </colgroup>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="pl-5">
              Item
            </TableHead>
            <TableHead scope="col" className="text-right">
              Expected
            </TableHead>
            <TableHead scope="col" className="text-right">
              Physical count
            </TableHead>
            <TableHead scope="col" className="text-right">
              Waste
            </TableHead>
            <TableHead scope="col" className="text-right">
              Adjustment
            </TableHead>
            <TableHead scope="col" className="text-right">
              Variance
            </TableHead>
            <TableHead scope="col" className="pr-4">
              <span className="sr-only">Stock movements</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        {props.items.map((item) => {
          const { values, changed } = rowState(props, item);
          if (!values) return null;
          return (
            <DailyReportCountRow
              key={item.id}
              item={item}
              values={values}
              changed={changed}
              editable={props.editable}
              pending={props.pending}
              attempted={props.attempted}
              onChange={props.onChange}
            />
          );
        })}
      </Table>
    </div>
  );
}
