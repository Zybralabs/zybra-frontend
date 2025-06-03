"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DatePicker() {
  const [date, setDate] = React.useState<Date>();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "justify-between text-left font-normal py-1 px-2 bg-[#1b304c] border-[0.25px] border-[#BBBBBB] outline-none !ring-offset-0 h-fit !text-white text-[12px] hover:bg-[#1b304c]",
            !date && "text-muted-foreground",
          )}
        >
          {date ? format(date, "PPP") : <span>Pick a date</span>}
          <CalendarIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-[#1b304c] text-white border-0" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
      </PopoverContent>
    </Popover>
  );
}
