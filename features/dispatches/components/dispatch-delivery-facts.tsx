import {
  dispatchCompletionSummary,
  isDispatchComplete,
} from "../services/dispatch-completion-summary";
import {
  dispatchDate,
  dispatchTime,
} from "../services/dispatch-detail-presentation";
import type { Dispatch } from "../types/dispatch.types";

function DeliveryDate({ value }: { value?: string | null }) {
  if (!value) return <>Not recorded</>;
  return (
    <time dateTime={value} className="flex flex-col gap-1">
      <span>{dispatchDate.format(new Date(value))}</span>
      <span className="text-sm font-normal text-muted-foreground">
        {dispatchTime.format(new Date(value))} PHT
      </span>
    </time>
  );
}

export function DispatchDeliveryFacts({ dispatch }: { dispatch: Dispatch }) {
  const completed = isDispatchComplete(dispatch);
  const { countedBy, completedAt } = dispatchCompletionSummary(dispatch);
  const facts = [
    {
      label: "Delivered by",
      value: dispatch.delivered_by_name ?? "Not recorded",
    },
    ...(dispatch.counted_at || completed
      ? [{ label: "Counted by", value: countedBy }]
      : []),
    ...(dispatch.dispatched_at
      ? [
          {
            label: "Sent",
            value: <DeliveryDate value={dispatch.dispatched_at} />,
          },
        ]
      : [
          { label: "Created by", value: dispatch.created_by_name },
          {
            label: "Created",
            value: <DeliveryDate value={dispatch.created_at} />,
          },
        ]),
    ...(completed
      ? [{ label: "Completed", value: <DeliveryDate value={completedAt} /> }]
      : []),
  ];
  return (
    <aside
      aria-labelledby="delivery-details-heading"
      className="order-2 min-w-0 border-t bg-muted/25 p-6 sm:p-7 xl:order-1 xl:border-t-0 xl:border-r"
    >
      <h2 id="delivery-details-heading" className="mb-6 text-base font-medium">
        Delivery details
      </h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 xl:grid-cols-1 xl:gap-y-7">
        {facts.map(({ label, value }) => (
          <div key={label} className="flex min-w-0 flex-col gap-1.5">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-base font-medium wrap-anywhere">{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
