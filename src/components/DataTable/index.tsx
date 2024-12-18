"use client";

import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight, PopupIcon } from "../Icons";
import { formatCurrency } from "@/utils/formatters";

const data: TableData[] = [
  {
    id: "m5gr84i9",
    quantity: 316,
    status: "Take Offer",
    name: "$AAPL",
    date: "06/09/2024",
    type: "Pool",
  },
  {
    id: "3u1reuv4",
    quantity: 242,
    status: "Take Offer",
    name: "$AAPL",
    date: "06/09/2024",
    type: "Pool",
  },
  {
    id: "derv1ws0",
    quantity: 837,
    status: "Take Offer",
    name: "$AAPL",
    date: "06/09/2024",
    type: "Pool",
  },
  {
    id: "5kma53ae",
    quantity: 874,
    status: "Take Offer",
    name: "$AAPL",
    date: "06/09/2024",
    type: "Pool",
  },
  {
    id: "bhqecj4p",
    quantity: 721,
    status: "Take Offer",
    name: "$AAPL",
    date: "06/09/2024",
    type: "Pool",
  },
];

export type TableData = {
  id: string;
  quantity: number;
  status: "Take Offer" | "Make Offer" | "Withdraw";
  name: string;
  type: "Stock" | "Pool";
  date: string;
};

export const columns: ColumnDef<TableData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      // <label className="border border-lightGrey bg-transparent rounded-sm w-5 h-5 flex justify-center items-center cursor-pointer">
      //   <input
      //     type="checkbox"
      //     className="peer hidden"
      //     checked={table.getIsAllPageRowsSelected()}
      //     onChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      //   />
      //   <span className="peer-checked:opacity-100 opacity-0 bg-[#006CFF] w-2.5 h-2.5 block"></span>
      // </label>
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
    cell: ({ row }) => <div className="capitalize">{row.getValue("logo")}</div>,
  },
  {
    accessorKey: "type",
    header: "TYPE",
    cell: ({ row }) => <div className="capitalize">{row.getValue("type")}</div>,
  },
  {
    accessorKey: "name",
    header: "NAME",
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "status",
    header: "STATUS",
    cell: ({ row }) => (
      <div className="px-2.5 py-0.5 rounded-full border border-black w-fit text-[10px] text-[#00F8DA] bg-[#033F43]">
        {row.getValue("status")}
      </div>
    ),
  },
  {
    accessorKey: "quantity",
    header: "QUANTITY",
    cell: ({ row }) => {
      const quantity = parseFloat(row.getValue("quantity"));
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
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <button>
          <ArrowRight />
        </button>
      );
    },
  },
];

type TableProps = {
  heading?: string;
  onPopup?: () => void;
};

function DataTable({ heading, onPopup }: TableProps) {
  const [rowSelection, setRowSelection] = React.useState<Record<number, boolean>>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  return (
    <div className="flex flex-col bg-darkGrassGreen rounded-2xl">
      <div className="px-4">
        <div className="py-3 flex w-full justify-between items-center text-white border-b border-[#253D54]">
          {heading && <h4 className="text-sm font-semibold">{heading}</h4>}
          {onPopup && (
            <i onClick={onPopup} className="cursor-pointer mr-2">
              <PopupIcon />
            </i>
          )}
        </div>
      </div>
      <div>
        <Table className="text-white text-sm">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-inherit border-none">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-white text-sm">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`hover:bg-current [state=selected]:bg-midSlate !border-0 ${rowSelection?.[i] ? "!bg-midSlate" : "!bg-darkGreen"}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default DataTable;
