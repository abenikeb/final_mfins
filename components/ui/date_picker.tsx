
"use client";
import { format,addMonths } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
	selected: Date;
	onSelect: (date: Date | undefined) => void;
	placeholderText?: string;
	className?: string;
}

export function DatePicker({
	selected,
	onSelect,
	placeholderText = "Pick a date",
	className,
}: DatePickerProps) {
	
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={"outline"}
					className={cn(
						"w-[240px] justify-start text-left font-normal",
						!selected && "text-muted-foreground",
						className
					)}>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{selected ? (
						// format(selected, "MMMM yyyy")
						format(addMonths(selected, -1), "MMMM yyyy") 
					) : (
						<span>{placeholderText}</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={selected}
					onSelect={onSelect}
					initialFocus
					defaultMonth={selected}
					fromDate={new Date(2000, 0)}
					toDate={new Date()}
					captionLayout="dropdown-buttons"
					showMonthYearPicker
				/>
			</PopoverContent>
		</Popover>
	);
}
