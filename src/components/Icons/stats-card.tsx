import { EthIcon } from ".";
import { Card } from "../Stake/Card";

interface StatsCardProps {
  label: string;
  value: string;
  showEthIcon?: boolean;
}

export function StatsCard({ label, value, showEthIcon = false }: StatsCardProps) {
  return (
    <Card className="bg-[#013853]/40 border-0 p-4 backdrop-blur-sm">
      <div className="text-sm text-gray-400">{label}</div>
      <div className="text-2xl font-bold flex items-center gap-2">
        {showEthIcon && <EthIcon className="h-4 w-4 text-gray-400" />}
        <div className="text-white">{value}</div>
      </div>
    </Card>
  );
}
