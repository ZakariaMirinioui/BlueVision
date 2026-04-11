export interface Schedule {
    id: string;
    name: string;
    priority: 'High' | 'Medium' | 'Low';
    startDate: string;
    endDate: string;
    displays: string[];
    status: 'Active' | 'Scheduled' | 'Completed';
    content: string;
    repeatSchedule?: 'none' | 'daily' | 'weekly' | 'monthly';
}

export interface CreateScheduleDto {
    name: string;
    priority: Schedule['priority'];
    startDate: Date;
    endDate: Date;
    displayIds: string[];
    content: string;
    repeatSchedule: Schedule['repeatSchedule'];
}