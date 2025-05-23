"use client";
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps {
	date: { from?: Date; to?: Date } | undefined;
	setDate: (date: { from?: Date; to?: Date } | undefined) => void;
}

export function DatePickerWithRange({
	date,
	setDate,
}: DatePickerWithRangeProps | any) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					id="date"
					variant={"outline"}
					className={cn(
						"w-[300px] justify-start text-left font-normal",
						!date && "text-muted-foreground"
					)}>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{date?.from ? (
						date.to ? (
							`${format(date.from, "MM/dd/yyyy")} - ${format(
								date.to,
								"MM/dd/yyyy"
							)}`
						) : (
							format(date.from, "MM/dd/yyyy")
						)
					) : (
						<span>Pick a date</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="range"
					defaultMonth={date?.from ? date.from : new Date()}
					selected={date}
					onSelect={setDate}
					numberOfMonths={2}
					pagedNavigation
					fromDate={addDays(new Date(), -365)}
					toDate={new Date()}
				/>
			</PopoverContent>
		</Popover>
	);
}
