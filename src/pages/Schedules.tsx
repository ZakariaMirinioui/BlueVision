import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, isSameDay, startOfMonth, getDay, isSameMonth } from 'date-fns';
import {
  CalendarIcon,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  XCircle,
  Calendar as CalendarIcon2,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ErrorBoundary from "@/components/ErrorBoundary";
import { supabase } from "@/lib/supabaseClient";
import { notifyAndLog } from '@/utils/notifyAndLog';

import type { Display } from "@/types/display";
import type { Schedule, CreateScheduleDto } from "@/types/schedule";
import type { Layout } from "@/types/layout-media";

const SchedulesContent = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedDisplays, setSelectedDisplays] = useState<string[]>([]);
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null);
  // Dialog state: mode = 'none' | 'create' | 'edit'
  const [dialogMode, setDialogMode] = useState<'none' | 'create' | 'edit'>('none');
  const [scheduleName, setScheduleName] = useState("");
  const [priority, setPriority] = useState<Schedule["priority"]>("Medium");
  const [selectedContent, setSelectedContent] = useState("");
  const [repeatSchedule, setRepeatSchedule] = useState<Schedule["repeatSchedule"]>("none");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [availableLayouts, setAvailableLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isContentOpen, setIsContentOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ name?: string; startDate?: string; endDate?: string; displays?: string; content?: string }>({});
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [eventDetail, setEventDetail] = useState<Schedule | null>(null);

  // --- Dialog state management ---
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailsSchedule, setDetailsSchedule] = useState<Schedule | null>(null);

  // 1. Add state for editing event
  const [editEvent, setEditEvent] = useState<Schedule | null>(null);
  const [editForm, setEditForm] = useState<Partial<Schedule>>({});
  const [editFormErrors, setEditFormErrors] = useState<{ name?: string; startDate?: string; endDate?: string; displays?: string; content?: string }>({});

  const filteredSchedules = useMemo(() => {
    // If loading or no schedules, return empty array
    if (loading || !Array.isArray(schedules)) return [];

    try {
      // If no search query, return all valid schedules
      const validSchedules = schedules.filter(schedule => {
        return schedule &&
          typeof schedule === 'object' &&
          schedule.id && // ensure id exists
          typeof schedule.name === 'string'; // ensure name is a string
      });

      if (!searchQuery || !searchQuery.trim()) return validSchedules;

      const query = searchQuery.toLowerCase().trim();
      return validSchedules.filter(schedule => {
        try {
          const name = (schedule?.name || '').toLowerCase();
          const content = (schedule?.content || '').toLowerCase();
          const priority = (schedule?.priority || '').toLowerCase();
          const status = (schedule?.status || '').toLowerCase();
          const displays = Array.isArray(schedule?.displays) ? schedule.displays : [];

          return (
            name.includes(query) ||
            content.includes(query) ||
            priority.includes(query) ||
            status.includes(query) ||
            displays.some(display => (display || '').toLowerCase().includes(query))
          );
        } catch (error) {
          console.error('Error filtering schedule:', schedule, error);
          return false;
        }
      });
    } catch (error) {
      console.error('Error filtering schedules:', error);
      return [];
    }
  }, [schedules, searchQuery, loading]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!mounted) return;

      try {
        setLoading(true);
        setError(null);

        // Initialize with empty arrays
        setSchedules([]);
        setDisplays([]);
        setAvailableLayouts([]);

        // Fetch schedules from Supabase
        const { data: scheduleData, error: scheduleError } = await supabase.from("schedules").select("*");
        if (scheduleError) throw scheduleError;

        // Map Supabase fields to local Schedule type, using correct enums
        const mappedSchedules = (scheduleData || []).map(s => ({
          id: s.id?.toString() ?? '',
          name: s.campaign ?? 'Untitled',
          priority: s.is_priority ? 'High' : 'Medium', // Only 'High' or 'Medium' possible from DB, fallback to 'Medium'
          startDate: s.from_dt ?? '',
          endDate: s.to_dt ?? '',
          displays: Array.isArray(s.display_groups) ? s.display_groups : [],
          status: 'Scheduled', // Default/fallback
          content: '', // Map if you have a content field
          repeatSchedule: (['none', 'daily', 'weekly', 'monthly'].includes(s.recurrence_type)) ? s.recurrence_type : 'none',
        })) as Schedule[];

        setSchedules(mappedSchedules);

        // Fetch displays and layouts from Supabase
        const [{ data: displayData, error: displayError }, { data: layoutData, error: layoutError }] = await Promise.all([
          supabase.from("displays").select("*"),
          supabase.from("layouts").select("*")
        ]);

        if (displayError) throw displayError;
        if (layoutError) throw layoutError;

        setDisplays((displayData || []).filter(d => d && d.id && d.name));
        setAvailableLayouts((layoutData || []).filter(l => l && l.id && l.name));

      } catch (err) {
        console.error('Error loading data:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load schedule data');
          toast({
            title: "Error",
            description: "Failed to load schedule data. Please try reloading the page.",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [toast]);

  // Handle URL parameters for automatic dialog opening
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      setDialogMode('create');
      // Remove the parameter from URL after opening dialog
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Helper: Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return schedules.filter(schedule => {
      if (!schedule || !schedule.startDate || !schedule.endDate) return false;
      const start = new Date(schedule.startDate);
      const end = new Date(schedule.endDate);
      return isWithinInterval(date, { start, end });
    });
  };

  // Helper: Render events for a specific date
  const renderEvents = (date: Date) => {
    const events = getEventsForDate(date);
    return events.map((event) => (
      <div
        key={event.id}
        onClick={() => handleEventClick(event)}
        className={cn(
          "px-2 py-1 rounded text-white text-sm mb-1 cursor-pointer truncate",
          event.priority === 'High' ? 'bg-red-500' : event.priority === 'Medium' ? 'bg-blue-500' : 'bg-gray-500'
        )}
        title={`Name: ${event.name}\nContent: ${event.content}\nDisplays: ${(event.displays || []).join(', ')}\n${format(new Date(event.startDate), 'PPP')} - ${format(new Date(event.endDate), 'PPP')}`}
      >
        {event.name}
      </div>
    ));
  };

  // Move the UI rendering logic here, inside SchedulesContent
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading schedules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!Array.isArray(schedules)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">Unable to load schedules</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // ...rest of the component's rendering logic (return (...)) goes here...

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = endOfWeek(selectedDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="grid grid-cols-7 gap-4 h-[600px]">
        {days.map((day) => (<div key={day.toISOString()} className="border rounded-lg p-2 bg-card hover:bg-accent/50 transition-colors">
          <div className="text-sm font-medium mb-2">
            {format(day, 'EEEE')}
            <br />
            {format(day, 'dd')}
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[500px]">
            {renderEvents(day)}
          </div>
        </div>
        ))}
      </div>
    );
  };

  const renderDayView = () => (
    <div className="min-h-[600px] relative p-4">
      <div className="text-center mb-6">
        <div className="text-2xl font-semibold mb-1">
          {format(selectedDate, 'EEEE')}
        </div>
        <div className={cn(
          "text-3xl font-bold",
          isSameDay(selectedDate, new Date()) && "text-primary"
        )}>
          {format(selectedDate, 'MMMM d, yyyy')}
        </div>
      </div>
      <div className="space-y-4">
        {schedules
          .filter(schedule => {
            const start = new Date(schedule.startDate);
            const end = new Date(schedule.endDate);
            return isWithinInterval(selectedDate, { start, end });
          })
          .map((event) => (
            <div
              key={event.id}
              onClick={() => handleViewDetails(event)}
              className={cn(
                "p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow",
                "bg-white"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-lg mb-1">{event.name}</h3>
                  <p className="text-sm text-muted-foreground">{event.content}</p>
                </div>
                <Badge variant={getBadgeVariant(event.priority)}>
                  {event.priority}
                </Badge>            </div>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <CalendarIcon2 className="w-4 h-4 mr-2" />
                {format(new Date(event.startDate), 'PPP')} - {format(new Date(event.endDate), 'PPP')}
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const getBadgeVariant = (priority: Schedule['priority']): "default" | "destructive" | "secondary" | "outline" => {
    switch (priority) {
      case "High":
        return "destructive";
      case "Medium":
        return "default";
      case "Low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const displaySchedules = (scheduleArray: Schedule[]) => {
    // Validate input array
    if (!Array.isArray(scheduleArray)) {
      console.error('Invalid schedule array:', scheduleArray);
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center py-6">
            <div className="flex flex-col items-center justify-center">
              <XCircle className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Error loading schedules</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Please try refreshing the page
              </p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (scheduleArray.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center py-6">
            <div className="flex flex-col items-center justify-center">
              <XCircle className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No schedules found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery.trim() ? "Try adjusting your search" : "Create a new schedule to get started"}
              </p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return scheduleArray.map(schedule => {
      // Validate each schedule object
      if (!schedule || typeof schedule !== 'object') {
        console.error('Invalid schedule:', schedule);
        return null;
      }

      return (
        <TableRow key={schedule.id}>
          <TableCell className="font-medium">{schedule?.name || 'Unnamed Schedule'}</TableCell>
          <TableCell>
            <Badge variant={getBadgeVariant(schedule?.priority || 'Medium')}>
              {schedule?.priority || 'Medium'}
            </Badge>
          </TableCell>
          <TableCell>
            {schedule?.startDate ? format(new Date(schedule.startDate), 'PPP') : 'Not set'}
          </TableCell>
          <TableCell>
            {schedule?.endDate ? format(new Date(schedule.endDate), 'PPP') : 'Not set'}
          </TableCell>
          <TableCell>{Array.isArray(schedule?.displays) ? schedule.displays.join(", ") : "No displays"}</TableCell>
          <TableCell>{schedule?.content || 'No content'}</TableCell>
          <TableCell>
            <div className="flex items-center">
              {schedule?.status === "Active" && <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />}
              {schedule?.status === "Scheduled" && <Clock className="mr-2 h-4 w-4 text-blue-500" />}
              {schedule?.status || 'Unknown'}
            </div>
          </TableCell>
          <TableCell className="w-[80px]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewDetails(schedule)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditSchedule(schedule)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleShowDeleteConfirmation(schedule.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      );
    }).filter(Boolean);
  };
  const handleViewDetails = (event: Schedule) => {
    setDetailsSchedule(event);
    setShowDetailsDialog(true);
  };

  const handleShowDeleteConfirmation = (scheduleId: string) => {
    setScheduleToDelete(scheduleId);
    setShowDeleteDialog(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setScheduleName(schedule.name);
    setPriority(schedule.priority);
    setStartDate(new Date(schedule.startDate));
    setEndDate(new Date(schedule.endDate));
    setSelectedDisplays(schedule.displays || []);
    setSelectedContent(schedule.content);
    setRepeatSchedule(schedule.repeatSchedule || 'none');
    setDialogMode('edit');
  };

  // Helper to reload schedules from Supabase
  async function reloadSchedules() {
    setLoading(true);
    const { data, error } = await supabase.from('schedules').select('*');
    if (!error && data) {
      setSchedules(data.map(s => ({
        id: s.id?.toString() ?? '',
        name: s.campaign ?? 'Untitled',
        priority: s.is_priority ? 'High' : 'Medium',
        startDate: s.from_dt ?? '',
        endDate: s.to_dt ?? '',
        displays: s.display_groups ?? [],
        status: 'Scheduled',
        content: '', // You can map content if you store it
        repeatSchedule: s.recurrence_type ?? 'none',
      })));
    }
    setLoading(false);
  }

  // --- CREATE SCHEDULE: Save to Supabase ---
  const handleCreateSchedule = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      // Map form fields to Supabase table columns
      const selectedLayout = availableLayouts.find(l => l.id.toString() === selectedContent);
      // Get current user id from localStorage
      let userId = null;
      try {
        const stored = localStorage.getItem('xibo_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          userId = parsed.id || null;
        }
      } catch { }
      const insertObj = {
        // Table columns
        display_group_ids: selectedDisplays.map(Number),
        campaign_id: null,
        command_id: null,
        day_part_id: null,
        user_id: userId, // Set user_id to current user's id
        from_dt: startDate ? startDate.toISOString() : null,
        to_dt: endDate ? endDate.toISOString() : null,
        is_priority: priority === 'High',
        display_order: null,
        recurrence_type: repeatSchedule !== 'none' ? repeatSchedule : null,
        recurrence_detail: null,
        recurrence_range: null,
        display_groups: selectedDisplays.map(String),
        campaign: scheduleName.trim(),
        day_part: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('schedules').insert([insertObj]);
      if (error) throw error;
      await reloadSchedules();
      setDialogMode('none');
      setScheduleName("");
      setPriority("Medium");
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedDisplays([]);
      setSelectedContent("");
      setRepeatSchedule("none");
      setFormErrors({});
      toast({ title: 'Success', description: 'Schedule created and saved.' });
      // Fetch username from Supabase for notification
      let username = '';
      try {
        const { data, error } = await supabase.from('users').select('username').eq('auth_uid', userId).single();
        if (!error && data && data.username) username = data.username;
      } catch { }
      await notifyAndLog({
        title: 'Schedule Created',
        message: `Schedule "${insertObj.campaign}" was created by ${username || 'Unknown User'}`,
        type: 'success',
        action_type: 'create',
        entity: 'schedule',
        entity_id: insertObj.campaign,
        user_id: userId,
        meta: { schedule: insertObj }
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create schedule.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- EDIT SCHEDULE: Update in Supabase ---
  const handleUpdateSchedule = async (schedule: Schedule) => {
    if (!validateForm()) {
      toast({ title: 'Validation Error', description: 'Please fix the errors in the form', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const selectedLayout = availableLayouts.find(l => l.id.toString() === selectedContent);
      // Debug: log the payload
      console.log('Updating schedule:', {
        campaign: scheduleName.trim(),
        from_dt: startDate?.toISOString(),
        to_dt: endDate?.toISOString(),
        display_groups: selectedDisplays.map(String),
        is_priority: priority === 'High',
        recurrence_type: repeatSchedule !== 'none' ? repeatSchedule : null,
      });
      const { error } = await supabase.from('schedules').update({
        campaign: scheduleName.trim(),
        from_dt: startDate?.toISOString(),
        to_dt: endDate?.toISOString(),
        display_groups: selectedDisplays.map(String),
        is_priority: priority === 'High',
        recurrence_type: repeatSchedule !== 'none' ? repeatSchedule : null,
      }).eq('id', schedule.id);
      if (error) throw error;
      await reloadSchedules();
      setDialogMode('none');
      setEditingSchedule(null);
      toast({ title: 'Success', description: 'Schedule updated.' });
      // Log activity for schedule edit
      let userId = null;
      try {
        const stored = localStorage.getItem('xibo_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          userId = parsed.id || null;
        }
      } catch { }
      // Fetch username from Supabase for notification
      let username = '';
      try {
        const { data, error } = await supabase.from('users').select('username').eq('auth_uid', userId).single();
        if (!error && data && data.username) username = data.username;
      } catch { }
      await notifyAndLog({
        title: 'Schedule Modified',
        message: `Schedule "${scheduleName.trim()}" was modified by ${username || 'Unknown User'}`,
        type: 'info',
        action_type: 'edit',
        entity: 'schedule',
        entity_id: schedule.id,
        user_id: userId,
        meta: { schedule: schedule }
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update schedule.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setActionLoading(null);
    }
  };

  // --- DELETE SCHEDULE: Remove from Supabase ---
  const handleDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    setIsLoading(true);
    try {
      // Find the schedule name before deleting
      const schedule = schedules.find(s => s.id?.toString() === scheduleToDelete?.toString());
      const scheduleName = schedule?.name || `ID ${scheduleToDelete}`;
      const { error } = await supabase.from('schedules').delete().eq('id', Number(scheduleToDelete));
      if (error) throw error;
      await reloadSchedules();
      setShowDeleteDialog(false);
      setScheduleToDelete(null);
      toast({ title: 'Success', description: 'Schedule deleted.' });
      // Log activity for schedule deletion
      let userId = null;
      try {
        const stored = localStorage.getItem('xibo_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          userId = parsed.id || null;
        }
      } catch { }
      // Fetch username from Supabase for notification
      let username = '';
      try {
        const { data, error } = await supabase.from('users').select('username').eq('auth_uid', userId).single();
        if (!error && data && data.username) username = data.username;
      } catch { /* empty */ }
      await notifyAndLog({
        title: 'Schedule Deleted',
        message: `Schedule "${scheduleName}" was deleted by ${username || 'Unknown User'}`,
        type: 'error',
        action_type: 'delete',
        entity: 'schedule',
        entity_id: scheduleToDelete,
        user_id: userId,
        meta: { scheduleId: scheduleToDelete, scheduleName }
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete schedule.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Validate form fields
  const validateForm = () => {
    const errors: typeof formErrors = {};
    if (!scheduleName.trim()) errors.name = 'Name is required';
    if (!startDate) errors.startDate = 'Start date is required';
    if (!endDate) errors.endDate = 'End date is required';
    if (!selectedContent) errors.content = 'Content is required';
    if (!selectedDisplays.length) errors.displays = 'Select at least one display';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 2. Add event detail/edit dialog
  const openEditDialog = (event: Schedule) => {
    setEditEvent(event);
    setEditForm({ ...event });
    setShowEventDialog(true);
  };

  const handleEditFormChange = (field: keyof Schedule, value: unknown) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const validateEditForm = () => {
    const errors: typeof editFormErrors = {};
    if (!editForm.name?.trim()) errors.name = 'Name is required';
    if (!editForm.startDate) errors.startDate = 'Start date is required';
    if (!editForm.endDate) errors.endDate = 'End date is required';
    if (!editForm.content) errors.content = 'Content is required';
    if (!editForm.displays || !editForm.displays.length) errors.displays = 'Select at least one display';
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = () => {
    if (!editEvent) return;
    if (!validateEditForm()) return;
    setSchedules(prev => prev.map(s => s.id === editEvent.id ? { ...s, ...editForm, name: editForm.name!.trim() } as Schedule : s));
    setShowEventDialog(false);
    setEditEvent(null);
    setEditForm({});
    setEditFormErrors({});
  };

  const handleDeleteEvent = () => {
    if (!editEvent) return;
    setSchedules(prev => prev.filter(s => s.id !== editEvent.id));
    setShowEventDialog(false);
    setEditEvent(null);
    setEditForm({});
    setEditFormErrors({});
  };

  // Update event click handler to open edit dialog
  const handleEventClick = (event: Schedule) => {
    openEditDialog(event);
  };

  // Event detail/edit dialog as a component
  const EventDetailDialog = () => (
    <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Schedule</DialogTitle>
        </DialogHeader>
        {editEvent && (
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={editForm.name || ''} onChange={e => handleEditFormChange('name', e.target.value)} className={cn(editFormErrors.name && 'border-red-500')} />
              {editFormErrors.name && <p className="text-sm text-red-500 mt-1">{editFormErrors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !editForm.startDate && 'text-muted-foreground', editFormErrors.startDate && 'border-red-500')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editForm.startDate ? format(new Date(editForm.startDate), 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={editForm.startDate ? new Date(editForm.startDate) : undefined} onSelect={date => handleEditFormChange('startDate', date?.toISOString())} initialFocus />
                  </PopoverContent>
                </Popover>
                {editFormErrors.startDate && <p className="text-sm text-red-500 mt-1">{editFormErrors.startDate}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !editForm.endDate && 'text-muted-foreground', editFormErrors.endDate && 'border-red-500')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editForm.endDate ? format(new Date(editForm.endDate), 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={editForm.endDate ? new Date(editForm.endDate) : undefined} onSelect={date => handleEditFormChange('endDate', date?.toISOString())} initialFocus />
                  </PopoverContent>
                </Popover>
                {editFormErrors.endDate && <p className="text-sm text-red-500 mt-1">{editFormErrors.endDate}</p>}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Select value={editForm.content || ''} onValueChange={val => handleEditFormChange('content', val)}>
                <SelectTrigger className={cn('mt-2', editFormErrors.content && 'border-red-500')}>
                  <SelectValue placeholder="Select content" />
                </SelectTrigger>
                <SelectContent>
                  {availableLayouts.map((layout) => (
                    <SelectItem key={layout.id} value={layout.name}>{layout.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editFormErrors.content && <p className="text-sm text-red-500 mt-1">{editFormErrors.content}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Displays</label>
              <div className="mt-2 space-y-2">
                {displays.map((display) => (
                  <div key={display.id} className="flex items-center space-x-2">
                    <input type="checkbox" id={`edit-display-${display.id}`} checked={!!editForm.displays?.includes(display.id)} onChange={e => {
                      if (e.target.checked) handleEditFormChange('displays', [...(editForm.displays || []), display.id]);
                      else handleEditFormChange('displays', (editForm.displays || []).filter(id => id !== display.id));
                    }} className="h-4 w-4 rounded border-gray-300" />
                    <label htmlFor={`edit-display-${display.id}`} className="text-sm">{display.name}</label>
                  </div>
                ))}
              </div>
              {editFormErrors.displays && <p className="text-sm text-red-500 mt-1">{editFormErrors.displays}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select value={editForm.priority || 'Medium'} onValueChange={val => handleEditFormChange('priority', val as Schedule['priority'])}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Repeat</label>
              <Select value={editForm.repeatSchedule || 'none'} onValueChange={val => handleEditFormChange('repeatSchedule', val as Schedule['repeatSchedule'])}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={editForm.status || 'Scheduled'} onValueChange={val => handleEditFormChange('status', val as Schedule['status'])}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="destructive" onClick={handleDeleteEvent}>Delete</Button>
          <Button type="button" variant="outline" onClick={() => setShowEventDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const SimpleDialog = () => (
    <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Schedule</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new schedule.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              className={cn(formErrors.name && "border-red-500")}
            />
            {formErrors.name && (
              <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                      formErrors.startDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {formErrors.startDate && (
                <p className="text-sm text-red-500 mt-1">{formErrors.startDate}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground",
                      formErrors.endDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {formErrors.endDate && (
                <p className="text-sm text-red-500 mt-1">{formErrors.endDate}</p>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Content</label>
            <Select
              value={selectedContent}
              onValueChange={setSelectedContent}
              open={isContentOpen}
              onOpenChange={setIsContentOpen}
            >
              <SelectTrigger className={cn("mt-2", formErrors.content && "border-red-500")}>
                <SelectValue placeholder="Select content" />
              </SelectTrigger>
              <SelectContent>
                {availableLayouts.map((layout) => (
                  <SelectItem key={layout.id} value={layout.id.toString()}>
                    {layout.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.content && (
              <p className="text-sm text-red-500 mt-1">{formErrors.content}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Displays</label>
            <div className="mt-2 space-y-2">
              {displays.map((display) => (
                <div key={display.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`display-${display.id}`}
                    checked={selectedDisplays.includes(display.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDisplays(prev => [...prev, display.id]);
                      } else {
                        setSelectedDisplays(prev => prev.filter(id => id !== display.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor={`display-${display.id}`} className="text-sm">
                    {display.name}
                  </label>
                </div>
              ))}
            </div>
            {formErrors.displays && (
              <p className="text-sm text-red-500 mt-1">{formErrors.displays}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={(value) => setPriority(value as Schedule['priority'])}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateSchedule} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Details Dialog
  const DetailsDialog = () => (
    <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Details</DialogTitle>
        </DialogHeader>
        {detailsSchedule && (
          <div className="space-y-2">
            <div><b>Name:</b> {detailsSchedule.name}</div>
            <div><b>Priority:</b> {detailsSchedule.priority}</div>
            <div><b>Start:</b> {format(new Date(detailsSchedule.startDate), 'PPP')}</div>
            <div><b>End:</b> {format(new Date(detailsSchedule.endDate), 'PPP')}</div>
            <div><b>Displays:</b> {(detailsSchedule.displays || []).join(', ')}</div>
            <div><b>Content:</b> {detailsSchedule.content}</div>
            <div><b>Status:</b> {detailsSchedule.status}</div>
            <div><b>Repeat:</b> {detailsSchedule.repeatSchedule}</div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setShowDetailsDialog(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Delete Dialog
  const DeleteDialog = () => (
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Schedule</DialogTitle>
          <DialogDescription>Are you sure you want to delete this schedule? This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button type="button" variant="destructive" onClick={handleDeleteSchedule} disabled={isLoading}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Edit Dialog (same as SimpleDialog but uses editingSchedule)
  const EditDialog = () => (
    <Dialog open={!!editingSchedule} onOpenChange={(open) => { if (!open) setEditingSchedule(null); }}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Schedule</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              className={cn(formErrors.name && "border-red-500")}
            />
            {formErrors.name && (
              <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                      formErrors.startDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {formErrors.startDate && (
                <p className="text-sm text-red-500 mt-1">{formErrors.startDate}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground",
                      formErrors.endDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {formErrors.endDate && (
                <p className="text-sm text-red-500 mt-1">{formErrors.endDate}</p>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Content</label>
            <Select
              value={selectedContent}
              onValueChange={setSelectedContent}
              open={isContentOpen}
              onOpenChange={setIsContentOpen}
            >
              <SelectTrigger className={cn("mt-2", formErrors.content && "border-red-500")}>
                <SelectValue placeholder="Select content" />
              </SelectTrigger>
              <SelectContent>
                {availableLayouts.map((layout) => (
                  <SelectItem key={layout.id} value={layout.id.toString()}>
                    {layout.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.content && (
              <p className="text-sm text-red-500 mt-1">{formErrors.content}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Displays</label>
            <div className="mt-2 space-y-2">
              {displays.map((display) => (
                <div key={display.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`display-${display.id}`}
                    checked={selectedDisplays.includes(display.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDisplays(prev => [...prev, display.id]);
                      } else {
                        setSelectedDisplays(prev => prev.filter(id => id !== display.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor={`display-${display.id}`} className="text-sm">
                    {display.name}
                  </label>
                </div>
              ))}
            </div>
            {formErrors.displays && (
              <p className="text-sm text-red-500 mt-1">{formErrors.displays}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={(value) => setPriority(value as Schedule['priority'])}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setEditingSchedule(null)}>Cancel</Button>
          <Button onClick={() => handleUpdateSchedule(editingSchedule!)} disabled={isLoading}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>
          <p className="text-muted-foreground">Create and manage content schedules for your displays</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schedules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[250px]"
            />
          </div>

          <Dialog open={dialogMode !== 'none'} onOpenChange={(open) => {
            if (!open) {
              setDialogMode('none');
              setEditingSchedule(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setDialogMode('create');
                setEditingSchedule(null);
                setScheduleName("");
                setPriority("Medium");
                setStartDate(undefined);
                setEndDate(undefined);
                setSelectedDisplays([]);
                setSelectedContent("");
                setRepeatSchedule("none");
                setFormErrors({});
              }} data-tour="create-schedule">
                <Plus className="mr-2 h-4 w-4" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{dialogMode === 'edit' ? 'Edit Schedule' : 'Create New Schedule'}</DialogTitle>
                {dialogMode === 'create' && (
                  <DialogDescription>
                    Fill in the details to create a new schedule.
                  </DialogDescription>
                )}
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                    className={cn(formErrors.name && "border-red-500")}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground",
                            formErrors.startDate && "border-red-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.startDate && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.startDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground",
                            formErrors.endDate && "border-red-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.endDate && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.endDate}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Select
                    value={selectedContent}
                    onValueChange={setSelectedContent}
                    open={isContentOpen}
                    onOpenChange={setIsContentOpen}
                  >
                    <SelectTrigger className={cn("mt-2", formErrors.content && "border-red-500")}>
                      <SelectValue placeholder="Select content" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLayouts.map((layout) => (
                        <SelectItem key={layout.id} value={layout.id.toString()}>
                          {layout.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.content && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.content}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Displays</label>
                  <div className="mt-2 space-y-2">
                    {displays.map((display) => (
                      <div key={display.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`display-${display.id}`}
                          checked={selectedDisplays.includes(display.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDisplays(prev => [...prev, display.id]);
                            } else {
                              setSelectedDisplays(prev => prev.filter(id => id !== display.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor={`display-${display.id}`} className="text-sm">
                          {display.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  {formErrors.displays && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.displays}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={priority} onValueChange={(value) => setPriority(value as Schedule['priority'])}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setDialogMode('none');
                  setEditingSchedule(null);
                }}>
                  Cancel
                </Button>
                {dialogMode === 'edit' ? (
                  <Button onClick={() => handleUpdateSchedule(editingSchedule!)} disabled={isLoading}>Save Changes</Button>
                ) : (
                  <Button onClick={handleCreateSchedule} disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Schedule"}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Select value={calendarView} onValueChange={(value: 'month' | 'week' | 'day') => setCalendarView(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue>
                {calendarView === 'month' ? 'Month View' : calendarView === 'week' ? 'Week View' : 'Day View'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month View</SelectItem>
              <SelectItem value="week">Week View</SelectItem>
              <SelectItem value="day">Day View</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (calendarView === 'month') {
                  setSelectedDate(prev => addMonths(prev, -1));
                } else if (calendarView === 'week') {
                  setSelectedDate(prev => addWeeks(prev, -1));
                } else {
                  setSelectedDate(prev => addDays(prev, -1));
                }
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (calendarView === 'month') {
                  setSelectedDate(prev => addMonths(prev, 1));
                } else if (calendarView === 'week') {
                  setSelectedDate(prev => addWeeks(prev, 1));
                } else {
                  setSelectedDate(prev => addDays(prev, 1));
                }
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{format(selectedDate, "MMMM yyyy")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {calendarView === 'month' && (
            <div className="grid grid-cols-7 gap-px bg-muted">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="bg-background p-2 text-sm font-medium">
                  {day}
                </div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => {
                const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i + 1);
                return (
                  <div
                    key={i}
                    className={cn(
                      'bg-background p-2 min-h-[100px]',
                      !isSameMonth(date, selectedDate) && 'text-muted-foreground'
                    )}
                  >
                    <div className="font-medium">{format(date, 'd')}</div>
                    <div className="space-y-1">{renderEvents(date)}</div>
                  </div>
                );
              })}
            </div>
          )}
          {calendarView === 'week' && renderWeekView()}
          {calendarView === 'day' && (
            <div className="space-y-2">
              <div className="font-medium">{format(selectedDate, 'EEEE, MMMM d')}</div>
              <div className="space-y-1">{renderEvents(selectedDate)}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- LIST BELOW CALENDAR --- */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Schedules List</CardTitle>
            <CardDescription>All schedules and quick actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Displays</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displaySchedules(filteredSchedules)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Render the event detail/edit dialog always so it can be opened by state */}
      <EventDetailDialog />
      <DetailsDialog />
      <DeleteDialog />
      {/* <EditDialog /> */}
    </div>
  );
};

const Schedules = () => {
  return (
    <ErrorBoundary>
      <SchedulesContent />
    </ErrorBoundary>
  );
};

export default Schedules;
