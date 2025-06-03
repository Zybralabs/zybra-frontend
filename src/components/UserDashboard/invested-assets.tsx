interface Asset {
  name: string;
  amount: string;
  change: string;
  isPositive: boolean;
}

interface InvestedAssetsProps {
  title: string;
  assets: Asset[];
}

export function InvestedAssets({ title, assets }: InvestedAssetsProps) {
  return (
    <div className="rounded-lg bg-[#0a1929] p-4">
      <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
      <div className="space-y-4">
        {assets.map((asset, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-white">{asset.name}</span>
            <div className="text-right">
              <div className="text-sm font-medium text-white">{asset.amount}</div>
              <div className={`text-xs ${asset.isPositive ? "text-green-400" : "text-red-400"}`}>
                {asset.isPositive ? "+" : ""}
                {asset.change}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
