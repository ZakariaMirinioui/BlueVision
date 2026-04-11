import { addHours, eachDayOfInterval, format } from "date-fns";
import type { DisplayActivityData, ContentPerformanceData, EngagementData } from "@/types/analytics";

export const generateMockDisplayActivity = (start: Date, end: Date): DisplayActivityData[] => {
    const data: DisplayActivityData[] = [];
    let current = start;

    while (current <= end) {
        // More active displays during business hours (8AM-6PM)
        const hour = current.getHours();
        const isBusinessHours = hour >= 8 && hour <= 18;

        data.push({
            timestamp: current.toISOString(),
            activeDisplays: isBusinessHours
                ? Math.floor(Math.random() * 5) + 5 // 5-10 during business hours
                : Math.floor(Math.random() * 3) + 2, // 2-5 outside business hours
            inactiveDisplays: Math.floor(Math.random() * 3) + 1, // 1-3 inactive
        });

        current = addHours(current, 1);
    }

    return data;
};

export const generateMockContentPerformance = (): ContentPerformanceData[] => {
    return [
        { type: "Marketing Campaigns", percentage: 45 },
        { type: "Company Updates", percentage: 25 },
        { type: "Event Schedules", percentage: 15 },
        { type: "Employee Communications", percentage: 10 },
        { type: "Other Content", percentage: 5 },
    ];
};

export const generateMockEngagement = (start: Date, end: Date): EngagementData[] => {
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
        // More engagement during weekdays
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const baseViews = isWeekend ? 500 : 1200;
        const baseInteractions = isWeekend ? 150 : 400;

        return {
            date: format(day, "yyyy-MM-dd"),
            views: Math.floor(baseViews + (Math.random() * 500)),
            interactions: Math.floor(baseInteractions + (Math.random() * 200)),
        };
    });
};
