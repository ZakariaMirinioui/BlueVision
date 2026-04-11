import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartTooltip } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { xiboService } from "@/services/XiboAPI";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useDateRange } from "@/hooks/use-date-range";
import { useToast } from "@/hooks/use-toast";

// Analytics data fetching hook
const useAnalyticsData = (timeRange: string, customRange?: { start: Date; end: Date }) => {
  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "24h":
        return {
          start: subDays(startOfDay(now), 1),
          end: endOfDay(now)
        };
      case "7d":
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        };
      case "30d":
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case "custom":
        return customRange || {
          start: startOfDay(now),
          end: endOfDay(now)
        };
      default:
        return {
          start: startOfDay(now),
          end: endOfDay(now)
        };
    }
  };

  const { start, end } = getDateRange();

  const { data: displayActivityData = [] } = useQuery({
    queryKey: ["displayActivity", timeRange, start, end],
    queryFn: () => xiboService.getDisplayActivity(start, end),
    refetchInterval: 60000
  });

  const { data: contentData = [] } = useQuery({
    queryKey: ["contentPerformance", timeRange],
    queryFn: () => xiboService.getContentPerformance(start, end),
    refetchInterval: 60000
  });

  const { data: engagementData = [] } = useQuery({
    queryKey: ["engagement", timeRange],
    queryFn: () => xiboService.getEngagementMetrics(start, end),
    refetchInterval: 60000
  });

  return {
    displayActivityData: displayActivityData.map(d => ({
      time: format(new Date(d.timestamp), "HH:mm"),
      active: d.activeDisplays,
      inactive: d.inactiveDisplays
    })),
    contentPerformanceData: contentData.map(d => ({
      name: d.type,
      value: d.percentage
    })),
    engagementData: engagementData.map(d => ({
      day: format(new Date(d.date), "EEE"),
      views: d.views,
      interactions: d.interactions
    }))
  };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState("24h");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const { dateRange, setDateRange, isOpen: isDatePickerOpen, setIsOpen: setDatePickerOpen } = useDateRange();

  const { displayActivityData, contentPerformanceData, engagementData } = useAnalyticsData(
    timeRange,
    timeRange === "custom" ? dateRange : undefined
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        xiboService.refreshDisplays(),
        xiboService.refreshContentStats(),
        xiboService.refreshEngagementStats()
      ]);
      toast({
        title: "Analytics refreshed",
        description: "All metrics have been updated with the latest data."
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Unable to update analytics data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = {
        displayActivity: displayActivityData,
        contentPerformance: contentPerformanceData,
        engagement: engagementData,
        timeRange,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-export-${format(new Date(), "yyyy-MM-dd")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Analytics data has been exported successfully."
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export analytics data. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 p-6 pb-16 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Real-time analytics and performance metrics
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2">
          <Button
            variant={timeRange === "24h" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("24h")}
            className="transition-colors duration-200"
          >
            24h
          </Button>
          <Button
            variant={timeRange === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("7d")}
            className="transition-colors duration-200"
          >
            7d
          </Button>
          <Button
            variant={timeRange === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("30d")}
            className="transition-colors duration-200"
          >
            30d
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setDatePickerOpen(true)}
            className="transition-transform hover:scale-105"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {timeRange === "custom"
              ? `${format(dateRange.start, 'MMM dd')} - ${format(dateRange.end, 'MMM dd')}`
              : "Custom"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="transition-transform hover:scale-105"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              "transition-transform hover:scale-105",
              isRefreshing && "animate-spin"
            )}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Date Picker Dialog */}
      <Dialog open={isDatePickerOpen} onOpenChange={setDatePickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Calendar
              mode="range"
              selected={{
                from: dateRange.start,
                to: dateRange.end
              }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({
                    start: range.from,
                    end: range.to
                  });
                  setTimeRange("custom");
                  setDatePickerOpen(false);
                }
              }}
              numberOfMonths={1}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Display Activity Chart */}
        <Card className="col-span-full lg:col-span-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
          <CardHeader>
            <CardTitle>Display Activity</CardTitle>
            <CardDescription>24-hour activity breakdown</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={displayActivityData}>
                  <defs>
                    <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="inactiveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00C49F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <ChartTooltip />
                  <Area
                    type="monotone"
                    dataKey="active"
                    stroke="#0088FE"
                    fill="url(#activeGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="inactive"
                    stroke="#00C49F"
                    fill="url(#inactiveGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Content Distribution Chart */}
        <Card className="lg:row-span-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
          <CardHeader>
            <CardTitle>Content Distribution</CardTitle>
            <CardDescription>Content type breakdown</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={contentPerformanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {contentPerformanceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {contentPerformanceData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm">{entry.name}</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {entry.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Engagement Chart */}
        <Card className="col-span-full lg:col-span-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
          <CardHeader>
            <CardTitle>Weekly Engagement</CardTitle>
            <CardDescription>Views and interactions per day</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip />
                  <Bar dataKey="views" fill="#0088FE" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="interactions" fill="#00C49F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;