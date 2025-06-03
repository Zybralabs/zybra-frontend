import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "../ui/checkbox";
import { ArrowRight, PoolIcon, PopupIcon, SwarmIcon, SwarmIcon2, ZybraLogo } from "../Icons";
import { formatCurrency } from "@/utils/formatters";
import { fromWei } from "@/hooks/formatting";
import { useStockIcon } from "@/hooks/useStockIcon";
import { getTransactionStatusColors } from "@/constant/transactionStatus";

export type TransactionTableData = {
  id: string;
  quantity: number;
  status: "Take Offer" | "Make Offer" | "Withdraw";
  name: string;
  type: "Stock" | "Pool";
  date: string;
};

export type PoolsTableData = {
  id: string;
  quantity: number;
  price: number;
  name: string;
  apy: string;
  roi: string;
  collateral_ratio: string;
  borrowed_ZRUSD: number;
  date: string;
  logo: React.ReactNode;
  indicator: React.ReactNode;
};

export const transactionCols: ColumnDef<TransactionTableData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        className="border border-lightGrey bg-transparent h-5 w-5"
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        className="border border-lightGrey bg-transparent"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // {
  //   accessorKey: "logo",
  //   header: "",
  //   size: 20,
  //   maxSize: 20,
  //   cell: ({ row }) => {
  //     return <div className="capitalize">{row.getValue("logo")}</div>;
  //   },
  // },
  {
    accessorKey: "type",
    header: "TYPE",
    cell: ({ row }) => {
      const Icon = row.getValue("type") === "stock" ? SwarmIcon : row.getValue("type") === "zybra" ? ZybraLogo : PoolIcon;
      console.log("Icon", row.getValue("type"))
      return (
        <div className="relative group">
          <div className="w-8 h-8 rounded-full bg-[#1a2733] hover:bg-[#2a3743] transition-all duration-200 flex items-center justify-center cursor-pointer">
            <div className="scale-[0.65] transform text-[#4477ff] group-hover:text-[#5588ff] transition-colors duration-200">
              <Icon />
            </div>
          </div>
        </div>
      )
    },
},
  // {
  //   accessorKey: "name",
  //   header: "NAME",
  //   cell: ({ row }) => <div>{row.getValue("name")}</div>,
  // },
  {
    accessorKey: "status",
    header: "STATUS",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const colors = getTransactionStatusColors(status);

      return (
        <div
          className={`capitalize px-2.5 py-0.5 rounded-full border border-black w-max text-[10px]`}
          style={{
            color: colors.text,
            backgroundColor: colors.bg
          }}
        >
          {status}
        </div>
      );
    },
},
  {
    accessorKey: "amount",
    header: "AMOUNT",
    cell: ({ row }) => {
      const quantity = fromWei(parseFloat(row.getValue("amount")));
      return <div>{quantity}</div>;
    },
  },
  {
    accessorKey: "date",
    header: "DATE",
    cell: ({ row }) => <div className="lowercase">{row.getValue("date")}</div>,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: () => {
      return (
        <button>
          <ArrowRight />
        </button>
      );
    },
  },
];

export const transactionModalCols: ColumnDef<TransactionTableData>[] = [
  ...transactionCols.slice(0, 4),
  {
    accessorKey: "allocation",
    header: "ALLOCATION",
    cell: ({ row }) => <div className="lowercase">{row.getValue("allocation")}</div>,
  },
  {
    accessorKey: "assetSymbol",
    header: "SYMBOL",
    cell: ({ row }) => {
    const Icon = useStockIcon(row.getValue("assetSymbol"))
    return(<div>{Icon ? <Icon /> : <SwarmIcon />}</div>)},
  },
  {
    accessorKey: "assetAddress",
    header: "ADDRESS",
    cell: ({ row }) => <div className="lowercase">{row.getValue("assetAddress")}</div>,
  },
  {
    accessorKey: "tx_hash",
    header: "TX HASH",
    cell: ({ row }) => <div className="lowercase">{row.getValue("tx_hash")}</div>,
  },
  // {
  //   accessorKey: "liquidity",
  //   header: "LIQUIDITY",
  //   cell: ({ row }) => {
  //     const val: any = row?.getValue("liquidity") || "";
  //     return (
  //       <div
  //         className={`capitalize ${val.toLowerCase() === "high" ? "text-midGreen" : "text-midRed"}`}
  //       >
  //         {row.getValue("liquidity")}
  //       </div>
  //     );
  //   },
  // },
  {
    accessorKey: "date",
    header: "DATE",
    cell: ({ row }) => <div className="lowercase">{row.getValue("date")}</div>,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const txHash = row.getValue("tx_hash");
      return (
        <button onClick={() => txHash && window.open(`https://sepolia.basescan.org/tx/${txHash}`, '_blank')}>
          <PopupIcon />
        </button>
      );
    },
  },
];

export const poolsModalCols: ColumnDef<PoolsTableData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        className="border border-lightGrey bg-transparent h-5 w-5"
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        className="border border-lightGrey bg-transparent"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "logo",
    header: "",
    size: 20,
    maxSize: 20,
    cell: ({ row }) => {
      return <div>{row.getValue("logo")}</div>;
    },
  },

  {
    accessorKey: "name",
    header: "NAME",
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "apy",
    header: "APY%",
    cell: ({ row }) => {
      const val = row?.getValue("apy") as string || "";
      return (
        <div className={`capitalize ${val?.[0] === "+" ? "text-midGreen" : "text-midRed"}`}>
          {val}
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "QUANTITY",
    cell: ({ row }) => <div>{row.getValue("quantity")}</div>,
  },
  {
    accessorKey: "price",
    header: "PRICE",
    cell: ({ row }) => {
      return <div>{formatCurrency(row.getValue("price"))}</div>;
    },
  },

  {
    accessorKey: "borrowed_ZRUSD",
    header: "Borrowed ZrUSD",
    cell: ({ row }) => <div>{row.getValue("borrowed_ZRUSD")}</div>,
  },
  {
    accessorKey: "collateral_ratio",
    header: "Collateral Ratio",
    cell: ({ row }) => <div>{row.getValue("collateral_ratio")}</div>,
  },
  {
    accessorKey: "roi",
    header: "ROI",
    cell: ({ row }) => <div>{row.getValue("roi")}</div>,
  },
  {
    accessorKey: "indicator",
    header: "",
    cell: ({ row }) => <div>{row.getValue("indicator")}</div>,
  },
];
