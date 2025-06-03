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
import { ArrowRight, PoolIcon, PopupIcon, SortingIcon, SwarmIcon2, ZybraLogo } from "../Icons";
import { formatCurrency } from "@/utils/formatters";
import { DatePicker } from "../DatePicker";
import Dropdown from "../Dropdown";
import { LoadingSpinner } from "../Modal/loading-spinner";
import { useStockIcon } from "@/hooks/useStockIcon";

type TableProps = {
  heading?: string;
  onPopup?: () => void;
  columns: any;
  data: any;
  filtration?: boolean;
  tableHeightClass?: string;
  isLoading?: boolean;
};

function DataTable({
  heading,
  onPopup,
  columns,
  data,
  filtration = false,
  tableHeightClass = "max-h-full",
  isLoading = false,
}: TableProps) {
  const [rowSelection, setRowSelection] = React.useState<Record<number, boolean>>({});

  // Process columns to handle icons for name/symbol field
  const processedColumns = React.useMemo(() => {
    return columns.map((column: { accessorKey: string; }) => {
      // Handle symbol column
      if (column.accessorKey === 'symbol') {
        console.log('column', column.accessorKey);
        return {
          ...column,
          cell: ({ row }: { row: any }) => {
            const value = row.getValue(column.accessorKey);
            const Icon = useStockIcon(value);
            
            return (
              <div className="flex items-center gap-2">
                {Icon && <Icon />}
                <span>{value}</span>
              </div>
            );
          }
        };
      }
      
      // Handle type column
      else if (column.accessorKey === 'type') {
        return {
          ...column,
          cell: ({ row }: { row: any }) => {
            const value = row.getValue(column.accessorKey);
            // For stock type, display SwarmIcon2
            
            
            return (
              <div className="flex items-center gap-2">
                {value === 'stock' ? <SwarmIcon2 /> : value === 'zybra' ? <ZybraLogo /> : <PoolIcon/>}
                {/* <span>{value}</span> */}
              </div>
            );
          }
        };
      }
      
      // Handle address column
      else if (column.accessorKey === 'address' || column.accessorKey === 'assetAddress') {
        return {
          ...column,
          cell: ({ row }: { row: any }) => {
            const value = row.getValue(column.accessorKey);
            // Truncate address for display - show first 6 and last 4 chars
            const truncatedAddr = value ? 
              `${value.substring(0, 6)}...${value.substring(value.length - 4)}` : 
              '-';
            
            return (
              <div className="flex items-center">
                <span className="font-mono">{truncatedAddr}</span>
              </div>
            );
          }
        };
      }
      
      // For other columns, return unchanged
      return column;
    });
  }, [columns]);

  const table = useReactTable({
    data: data || [],
    columns: processedColumns,
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
    <div className="flex flex-col bg-darkGrassGreen rounded-2xl overflow-hidden h-full w-full">
      <div className="px-4">
        <div className="py-3 flex w-full justify-between items-center border-b border-[#253D54]">
          {heading && <h4 className="text-sm font-semibold text-white">{heading}</h4>}
          {onPopup && (
            <i onClick={onPopup} className="cursor-pointer mr-2">
              <PopupIcon />
            </i>
          )}
          {filtration && (
            <div className="flex items-center gap-3 w-1/2">
              <div className="flex flex-col gap-0.5 flex-1">
                <span className="text-[10px] text-[#939393]">Show</span>
                <Dropdown onChange={() => {}} value="Transactions" options={["Transactions", "Stocks", "Pools"]} />
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <span className="text-[10px] text-[#939393]">Start Date</span>
                <DatePicker />
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <span className="text-[10px] text-[#939393]">End Date</span>
                <DatePicker />
              </div>
              <button className="mt-4">
                <SortingIcon />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className={`${tableHeightClass} h-full w-full`}>
        <Table className="text-white text-sm w-full">
          {/* Table Header */}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-inherit border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-white text-sm sticky top-0 bg-[#012b3f] z-10"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <LoadingSpinner />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`hover:bg-current [state=selected]:bg-midSlate !border-0 ${rowSelection?.[i] ? "!bg-midSlate" : "!bg-[#012b3f]"}`}
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
                  No assets found.
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