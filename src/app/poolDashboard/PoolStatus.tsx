import { StatusChip, type StatusChipProps } from "@centrifuge/fabric";

export type PoolStatusKey = "Open for investments" | "Closed" | "Upcoming" | "Archived";

const statusColor = {
  "Open for investments": "Open for investments",
  Closed: "Closed",
  Upcoming: "Upcoming",
  Archived: "Archived",
};

export function PoolStatus({ status }: { status: PoolStatusKey }) {
  const active =
    statusColor[status] === "Open for investments" || statusColor[status] === "Upcoming";
  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-md bg-[#001620] border-[0.25px] ${active ? "border-midGreen/50 text-midGreen" : "border-midRed/50 text-midRed"}  text-sm`}
    >
      <span className={`${active ? "bg-midGreen" : "bg-midRed"} w-2 h-2 rounded-full mr-2`}></span>
      <p className="text-xs"> {status} </p>
    </div>
  );
}
