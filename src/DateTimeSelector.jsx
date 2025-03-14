import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

const DateTimeSelector = ({ onDateTimeChange }) => {
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState("08:00");
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isTimeOpen, setIsTimeOpen] = useState(false);

    // Update parent component when date or time changes
    useEffect(() => {
        const dateTimeObj = new Date(date);
        const [hours, minutes] = time.split(':').map(Number);
        dateTimeObj.setHours(hours, minutes, 0, 0);
        onDateTimeChange(dateTimeObj);
    }, [date, time]);

    // Format date for display
    const formattedDate = format(date, "PPP");

    // Handle time input change
    const handleTimeChange = (e) => {
        setTime(e.target.value);
    };

    return (
        <div className="flex space-x-2">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="flex-1 justify-start text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formattedDate}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => {
                            if (newDate) {
                                setDate(newDate);
                                setIsCalendarOpen(false);
                            }
                        }}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            <Popover open={isTimeOpen} onOpenChange={setIsTimeOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-32 justify-start text-left font-normal"
                    >
                        <Clock className="mr-2 h-4 w-4" />
                        {time}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                    <div className="space-y-2">
                        <div className="grid gap-2">
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="time"
                                    value={time}
                                    onChange={handleTimeChange}
                                    className="w-full"
                                />
                                <Button
                                    onClick={() => setIsTimeOpen(false)}
                                    size="sm"
                                >
                                    Apply
                                </Button>
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                {["06:00", "08:00", "12:00", "15:00", "17:00", "19:00", "21:00", "23:00"].map((preset) => (
                                    <Button
                                        key={preset}
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "text-xs",
                                            time === preset && "bg-primary text-primary-foreground"
                                        )}
                                        onClick={() => {
                                            setTime(preset);
                                        }}
                                    >
                                        {preset}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default DateTimeSelector;