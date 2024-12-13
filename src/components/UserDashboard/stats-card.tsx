interface StatsCardProps {
  title: string;
  value: string;
  change: {
    value: string;
    isPositive: boolean;
  };
  today?: string;
  icon?: React.ReactNode;
}

export function StatsCard({ title, value, change, today, icon }: StatsCardProps) {
  return (
    <div className="rounded-lg bg-[#1D212F] p-4 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          {title}
          {icon && <span className="text-gray-500">{icon}</span>}
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{value}</span>
        <span className={`text-sm ${change.isPositive ? "text-green-400" : "text-red-400"}`}>
          {change.isPositive ? "+" : ""}
          {change.value}
        </span>
      </div>
      {today && <div className="mt-1 text-xs text-gray-500">{today}</div>}
    </div>
  );
}
