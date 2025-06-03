import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/utils/cn";

type DropdownProps = {
  defaultValue?: string;
  options: string[];
  value: string;
  selectClass?: string;
  optionsClass?: string;
  itemClass?: string;
  onChange: () => void;
};

const Dropdown: React.FC<DropdownProps> = ({
  options,
  defaultValue,
  value,
  selectClass,
  optionsClass,
  itemClass,
  onChange,
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "h-fit w-full py-1 px-2 text-white text-[12px] bg-[#012b3f] border-[0.25px] border-[#BBBBBB] outline-none !ring-offset-0",
          selectClass,
        )}
      >
        <SelectValue placeholder={value ?? defaultValue ?? "Select..."} />
      </SelectTrigger>
      <SelectContent className={cn("bg-[#012b3f] border-0", optionsClass)}>
        {options.map((option, i) => (
          <SelectItem
            className={cn("!text-white !bg-transparent text-[12px] cursor-pointer", itemClass)}
            value={option}
            key={i}
          >
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default Dropdown;
