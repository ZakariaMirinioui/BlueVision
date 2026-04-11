import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "@/hooks/use-date-range";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface DatePickerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    dateRange: DateRange;
    onDateRangeChange: (range: DateRange) => void;
}

export function DatePickerDialog({
    isOpen,
    onClose,
    dateRange,
    onDateRangeChange,
}: DatePickerDialogProps) {
    const [tempRange, setTempRange] = React.useState(dateRange);

    React.useEffect(() => {
        setTempRange(dateRange);
    }, [dateRange]);

    const handleSelect = (date: Date | undefined) => {
        if (!date) return;

        if (!tempRange.start || (tempRange.start && tempRange.end)) {
            setTempRange({
                start: date,
                end: date,
            });
        } else {
            setTempRange({
                start: tempRange.start,
                end: date,
            });
        }
    };

    const handleApply = () => {
        onDateRangeChange(tempRange);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Select Date Range</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Calendar
                        mode="range"
                        selected={{
                            from: tempRange.start,
                            to: tempRange.end,
                        }}
                        onSelect={(value: { from: Date; to: Date } | undefined) => {
                            if (value?.from && value?.to) {
                                setTempRange({
                                    start: value.from,
                                    end: value.to,
                                });
                            }
                        }}
                        numberOfMonths={2}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleApply}>Apply Range</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
