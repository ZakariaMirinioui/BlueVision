export interface DisplayActivityData {
    timestamp: string;
    activeDisplays: number;
    inactiveDisplays: number;
}

export interface ContentPerformanceData {
    type: string;
    percentage: number;
}

export interface EngagementData {
    date: string;
    views: number;
    interactions: number;
}

export interface AnalyticsTimeRange {
    start: Date;
    end: Date;
}
