import { useState } from "react";

export interface DateRange {
    start: Date;
    end: Date;
}

export const useDateRange = () => {
    const [dateRange, setDateRange] = useState<DateRange>({
        start: new Date(),
        end: new Date()
    });
    const [isOpen, setIsOpen] = useState(false);

    return {
        dateRange,
        setDateRange,
        isOpen,
        setIsOpen
    };
};
