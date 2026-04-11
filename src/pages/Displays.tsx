import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Monitor,
  Search,
  Plus,
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  MessageSquare,
  Eye,
  PowerOff,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";
import { xiboApi } from "@/api/xiboApi";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import StatusBadge, { StatusType } from "@/components/StatusBadge";
import type { Display } from "@/types/display";
import { Json } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import MessageDialog from "@/components/MessageDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { useNotificationStore } from "@/stores/useNotificationStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlayerConfigDialog } from "@/components/PlayerConfigDialog";
import { notifyAndLog } from '@/utils/notifyAndLog';

interface DisplayDiagnostics {
  status: 'online' | 'offline' | 'unknown';
  lastSeen: string;
}

export default function Displays() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore(state => state.addNotification);
  const permissions = usePermissions();

  // State declarations
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusType>("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedDisplayIds, setSelectedDisplayIds] = useState<string[]>([]);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Handle URL parameters for automatic dialog opening
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'message') {
      setMessageDialogOpen(true);
      // Remove the parameter from URL after opening dialog
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);
  const [viewDisplay, setViewDisplay] = useState<Display | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [displayToDelete, setDisplayToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [displayToReboot, setDisplayToReboot] = useState<{ id: string; name: string } | null>(null);
  // Add edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [displayToEdit, setDisplayToEdit] = useState<Display | null>(null);
  const [diagnosticsDialogOpen, setDiagnosticsDialogOpen] = useState(false);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DisplayDiagnostics | null>(null);
  const [diagnosticsScreenshot, setDiagnosticsScreenshot] = useState<string>("");
  const [diagnosticsLogs, setDiagnosticsLogs] = useState<string[]>([]);
  const [diagnosticsDisplay, setDiagnosticsDisplay] = useState<Display | null>(null);
  const [commandLoading, setCommandLoading] = useState<string | null>(null);

  // Fetch displays from Supabase
  const { data: displayList = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["displays"],
    queryFn: async () => {
      const [{ data: displays, error: displaysError }, { data: users, error: usersError }] = await Promise.all([
        supabase.from("displays").select("*"),
        supabase.from("users").select("auth_uid, username")
      ]);

      if (displaysError) throw displaysError;
      if (usersError) throw usersError;

      const userMap = new Map(users.map(u => [u.auth_uid, u.username]));

      return (displays || []).map((d) => ({
        ...d,
        id: d.id,
        name: d.name,
        location: d.location ?? "",
        group_name: d.group_name ?? "Unassigned",
        status: d.status as StatusType,
        lastSeen: d.last_ping ?? "",
        currentLayout: d.current_layout ?? "",
        owner: userMap.get(d.user_id) || "N/A",
      }));
    },
    // Keep data fresh, adjust interval as needed
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  const deleteMutation = useMutation({
    mutationFn: async (displayId: string) => {
      const { error } = await supabase.from("displays").delete().eq("id", displayId);
      if (error) throw error;
    },
    onSuccess: async (_, displayId) => {
      queryClient.invalidateQueries({ queryKey: ["displays"] });
      toast({ title: "Success", description: `Display ${displayId} deleted successfully!` });
      await notifyAndLog({
        title: "Display Deleted",
        message: `Display with ID ${displayId} has been deleted from your network.`,
        type: "success",
        link: "/displays",
        action_type: "delete",
        entity: "display",
        entity_id: displayId,
        user_id: undefined,
        meta: { id: displayId }
      });
    },
    onError: (error: Error, displayId) => {
      toast({ title: "Error", description: `Failed to delete display ${displayId}: ${error.message}`, variant: "destructive" });
    }
  });

  // Mutation for editing/updating a display in Supabase
  const editMutation = useMutation({
    mutationFn: async (updatedDisplay: Partial<Display> & { id: string }) => {
      // Only send fields that exist in the Supabase table
      const updatePayload = {
        name: updatedDisplay.name,
        location: updatedDisplay.location,
        group_name: updatedDisplay.group_name,
        status: updatedDisplay.status,
        // Add more fields if you add them to the dialog and Supabase table
      }
      const { error } = await supabase.from("displays").update(updatePayload).eq("id", updatedDisplay.id);
      if (error) throw error;
      return updatedDisplay;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["displays"] });
      toast({ title: "Success", description: `Display updated successfully!` });
      setEditDialogOpen(false);
      setDisplayToEdit(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update display: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Updated type-safe helper functions
  const safeDisplayName = (display: Partial<Display>): string => display?.name || "Unnamed Display";
  const safeDisplayId = (display: Partial<Display>): string => display?.id || "0";
  const safeGroup = (display: Partial<Display>): string => display?.group_name || "Default";
  const getDisplayStatus = (display: Partial<Display>): StatusType => {
    if (!display) return "offline";
    switch (display.status) {
      case "active":
      case "online":
      case "offline":
      case "error":
        return display.status;
      default:
        return "offline";
    }
  };

  // Helper to get a user-friendly display ID (just a number, e.g. 01, 02, ...)
  const getFriendlyDisplayId = (id: string, index: number): string => {
    // If the id contains digits, extract and pad them, else use the index
    const match = id.match(/\d+/);
    if (match) {
      return match[0].padStart(2, '0');
    }
    return (index + 1).toString().padStart(2, '0');
  };

  // Filter logic
  const filteredDisplays = (displayList || []).filter((display) => {
    if (!display) return false;
    const matchesSearch =
      (display.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (display.id || "").toString().includes(searchQuery) ||
      (display.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const currentStatus = getDisplayStatus(display);
    const matchesStatus = statusFilter === "all" || currentStatus === statusFilter;
    const matchesGroup = groupFilter === "all" || display.group_name === groupFilter;
    return matchesSearch && matchesStatus && matchesGroup;
  });

  // Dynamically extract unique groups from displayList
  const uniqueGroups = Array.from(new Set(displayList.map(display => display.group_name || "Unassigned")));

  // Helper to get group name
  const getGroupName = (groupName: string | undefined) => groupName || "Unassigned";

  const handleRefresh = () => {
    refetch();
    toast({ title: "Refreshing...", description: "Fetching latest display data." });
  };

  // Handler functions
  const handleOpenMessageDialog = (displayId?: string) => {
    if (displayId) {
      setSelectedDisplayIds([displayId]);
    } else {
      const selectedIds = filteredDisplays.map(d => d.id);
      setSelectedDisplayIds(selectedIds);
    }
    setMessageDialogOpen(true);
  };

  // Handler to open view dialog
  const handleOpenViewDialog = (display: Display) => {
    if (!display) return;
    setViewDisplay({ ...display });
    setIsViewDialogOpen(true);
  };

  // Handler to open edit dialog
  const handleEditDisplay = (display: Display) => {
    setDisplayToEdit(display);
    setEditDialogOpen(true);
  };

  const formatLastSeen = (lastSeen: string | undefined): string => {
    if (!lastSeen) return "Never";
    try {
      const date = new Date(lastSeen);
      return date.toLocaleString();
    } catch (e) {
      return "Invalid date";
    }
  };

  // Compute display statistics with new status types
  const displayStats = {
    total: displayList.length || 0,
    active: displayList.filter(d => getDisplayStatus(d) === "active").length || 0,
    online: displayList.filter(d => getDisplayStatus(d) === "online").length || 0,
    offline: displayList.filter(d => getDisplayStatus(d) === "offline").length || 0,
    error: displayList.filter(d => getDisplayStatus(d) === "error").length || 0
  };

  const handleConfirmDelete = () => {
    if (!displayToDelete) return;

    deleteMutation.mutate(displayToDelete.id);
    setDeleteDialogOpen(false);
    setDisplayToDelete(null);
  };

  const handleDeleteDisplay = (displayId: string, displayName: string) => {
    setDisplayToDelete({ id: displayId, name: displayName });
    setDeleteDialogOpen(true);
  };

  // Handler to confirm edit
  const handleConfirmEdit = () => {
    if (displayToEdit) {
      editMutation.mutate(displayToEdit);
    }
  };

  const handleOpenDiagnosticsDialog = async (display: Display) => {
    setDiagnosticsDialogOpen(true);
    setDiagnosticsDisplay(display);
    setDiagnosticsLoading(true);
    try {
      const status = await xiboApi.getDisplayStatus(display.id);
      setDiagnostics(status);
      const screenshot = await xiboApi.getDisplayScreenshot(display.id);
      setDiagnosticsScreenshot(screenshot);
      const logs = await xiboApi.getDisplayLogs(display.id);
      setDiagnosticsLogs(logs);
    } catch (error) {
      toast({ title: "Diagnostics Error", description: error instanceof Error ? error.message : 'Failed to fetch diagnostics', variant: "destructive" });
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  const handleRebootDisplay = async (display: Display) => {
    setCommandLoading("reboot-" + display.id);
    try {
      await xiboApi.rebootDisplay(display.id);
      toast({ title: "Reboot Command Sent", description: `Display ${display.name} will reboot shortly.`, variant: "default" });
    } catch (error) {
      toast({ title: "Reboot Error", description: error instanceof Error ? error.message : 'Failed to send reboot command', variant: "destructive" });
    } finally {
      setCommandLoading(null);
    }
  };

  const handleUpdateDisplay = async (display: Display) => {
    setCommandLoading("update-" + display.id);
    try {
      await xiboApi.updateDisplay(display.id);
      toast({ title: "Update Command Sent", description: `Display ${display.name} will update shortly.`, variant: "default" });
    } catch (error) {
      toast({ title: "Update Error", description: error instanceof Error ? error.message : 'Failed to send update command', variant: "destructive" });
    } finally {
      setCommandLoading(null);
    }
  };

  const handleScreenshotDisplay = async (display: Display) => {
    setCommandLoading("screenshot-" + display.id);
    try {
      const url = await xiboApi.takeScreenshot(display.id);
      setDiagnosticsScreenshot(url);
      toast({ title: "Screenshot Taken", description: `Latest screenshot for ${display.name} fetched.`, variant: "default" });
    } catch (error) {
      toast({ title: "Screenshot Error", description: error instanceof Error ? error.message : 'Failed to take screenshot', variant: "destructive" });
    } finally {
      setCommandLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-8 md:px-8 lg:px-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Display Management
              </h2>
              <p className="text-muted-foreground max-w-[600px] leading-relaxed">
                Monitor, control, and manage your digital display network
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading || deleteMutation.isPending}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Actualiser
              </Button>
              <Button asChild data-tour="add-display">
                <Link to="/displays/create">
                  <Plus className="mr-2 h-4 w-4" />
                  New Display
                </Link>
              </Button>
              <Button
                onClick={() => handleOpenMessageDialog()}
                className="bg-primary shadow-lg shadow-primary/25 hover:shadow-primary/40"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mt-8" data-tour="display-status">
            <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
              <div className="p-3 rounded-full bg-primary/10">
                <Monitor className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <h3 className="text-2xl font-bold">{displayStats.total}</h3>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
              <div className="p-3 rounded-full bg-emerald-500/10">
                <Activity className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <h3 className="text-2xl font-bold">{displayStats.active}</h3>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
              <div className="p-3 rounded-full bg-blue-500/10">
                <CheckCircle className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online</p>
                <h3 className="text-2xl font-bold">{displayStats.online}</h3>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
              <div className="p-3 rounded-full bg-gray-500/10">
                <XCircle className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offline</p>
                <h3 className="text-2xl font-bold">{displayStats.offline}</h3>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
              <div className="p-3 rounded-full bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error</p>
                <h3 className="text-2xl font-bold">{displayStats.error}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 md:p-8 lg:p-12">
        <Card>
          <CardHeader>
            <CardTitle>All Displays</CardTitle>
            <CardDescription>Overview of all connected digital displays.</CardDescription>
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID or tag..."
                  className="pl-10 w-full md:w-[300px] lg:w-[400px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-4 flex-wrap">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | StatusType)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All groups</SelectItem>
                    {uniqueGroups.map((group) => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location/Group</TableHead>
                    <TableHead>Last Connection</TableHead>
                    <TableHead>Current Layout</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                        <p className="mt-2 text-muted-foreground">Loading displays...</p>
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-destructive">
                        Error loading displays. Please refresh.
                      </TableCell>
                    </TableRow>
                  ) : filteredDisplays && filteredDisplays.length > 0 ? (
                    filteredDisplays.map((display, index) => (
                      <TableRow key={display.id}>
                        <TableCell>
                          <div className="font-medium">{display.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {getFriendlyDisplayId(display.id, index)}</div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={getDisplayStatus(display)} />
                        </TableCell>
                        <TableCell>
                          {display.group_name ? (
                            <Badge variant="outline" className="font-normal">
                              {getGroupName(display.group_name)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatLastSeen(display.lastSeen)}</span>
                        </TableCell>
                        <TableCell>
                          {display.currentLayout ? (
                            <span className="text-sm">{display.currentLayout}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleOpenMessageDialog(display.id)}>
                                <MessageSquare className="mr-2 h-4 w-4" /> Send Message
                              </DropdownMenuItem>
                              {permissions.canEditContent(display.user_id) && (
                                <DropdownMenuItem onClick={() => handleEditDisplay(display)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleOpenViewDialog(display)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {permissions.canDeleteContent(display.user_id) && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteDisplay(display.id, display.name)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleOpenDiagnosticsDialog(display)}>
                                <Activity className="mr-2 h-4 w-4" /> View Diagnostics
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRebootDisplay(display)} disabled={commandLoading === `reboot-${display.id}`}>
                                <PowerOff className="mr-2 h-4 w-4" /> Reboot
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateDisplay(display)} disabled={commandLoading === `update-${display.id}`}>
                                <RefreshCw className="mr-2 h-4 w-4" /> Update
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleScreenshotDisplay(display)} disabled={commandLoading === `screenshot-${display.id}`}>
                                <Camera className="mr-2 h-4 w-4" /> Screenshot
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center">
                          <Monitor className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No displays found</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Try modifying your filters or add new displays.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Message Dialog */}
      <MessageDialog
        isOpen={messageDialogOpen}
        onClose={() => setMessageDialogOpen(false)}
        displayIds={selectedDisplayIds.map(id => parseInt(id)).filter(id => !isNaN(id))}
        sendMessageFunction={async (displayIds, subject, body, isInterrupt) => {
          const { error } = await supabase.rpc('send_message', { display_ids: displayIds, subject, body, is_interrupt: isInterrupt });
          if (error) throw error;
        }}
      />

      {/* View Display Dialog */}
      {viewDisplay && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Display Details</DialogTitle>
              <DialogDescription>
                Detailed information about the selected display.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Status:</span>
                <StatusBadge status={getDisplayStatus(viewDisplay)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium">ID:</span>
                <span>{safeDisplayId(viewDisplay)}</span>

                <span className="font-medium">Name:</span>
                <span>{safeDisplayName(viewDisplay)}</span>

                <span className="font-medium">Last Connection:</span>
                <span>{formatLastSeen(viewDisplay.lastSeen)}</span>

                <span className="font-medium">Current Layout:</span>
                <span>{viewDisplay.currentLayout || "None"}</span>

                <span className="font-medium">Version:</span>
                <span>{viewDisplay.clientVersion || "Unknown"}</span>

                <span className="font-medium">IP Address:</span>
                <span>{viewDisplay.clientAddress || "Unknown"}</span>

                <span className="font-medium">Resolution:</span>
                <span>{viewDisplay.resolution || "Unknown"}</span>

                <span className="font-medium">Owner:</span>
                <span>{viewDisplay.owner || "Unknown"}</span>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Display</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete display "{displayToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Display
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Player Configuration Dialog */}
      <PlayerConfigDialog
        isOpen={isConfigOpen}
        onClose={() => {
          setIsConfigOpen(false);
          setDisplayToReboot(null);
        }}
        onConnect={() => { /* TODO: Implement or remove this handler if not needed */ }}
      />

      {/* Edit Display Dialog */}
      {editDialogOpen && displayToEdit && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Display</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1 text-foreground">Name</label>
              <input
                className="w-full border rounded px-2 py-1 bg-background text-foreground"
                value={displayToEdit.name}
                onChange={e => setDisplayToEdit({ ...displayToEdit, name: e.target.value })}
                placeholder="Name"
              />
              <label className="block text-sm font-medium mb-1 text-foreground">Location</label>
              <input
                className="w-full border rounded px-2 py-1 bg-background text-foreground"
                value={displayToEdit.location}
                onChange={e => setDisplayToEdit({ ...displayToEdit, location: e.target.value })}
                placeholder="Location"
              />
              <label className="block text-sm font-medium mb-1 text-foreground">Group Name</label>
              <input
                className="w-full border rounded px-2 py-1 bg-background text-foreground"
                value={displayToEdit.group_name}
                onChange={e => setDisplayToEdit({ ...displayToEdit, group_name: e.target.value })}
                placeholder="Group Name"
              />
              <label className="block text-sm font-medium mb-1 text-foreground">Status</label>
              <select
                className="w-full border rounded px-2 py-1 bg-background text-foreground"
                value={displayToEdit.status}
                onChange={e => setDisplayToEdit({ ...displayToEdit, status: e.target.value as Display["status"] })}
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="active">Active</option>
                <option value="error">Error</option>
              </select>
            </div>
            <DialogFooter>
              <Button onClick={handleConfirmEdit} disabled={editMutation.isPending}>Save</Button>
              <Button variant="secondary" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
            {editMutation.isError && (
              <div className="text-red-500 text-sm mt-2">{(editMutation.error as Error).message}</div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Diagnostics Dialog */}
      {diagnosticsDialogOpen && diagnosticsDisplay && (
        <Dialog open={diagnosticsDialogOpen} onOpenChange={setDiagnosticsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remote Diagnostics</DialogTitle>
              <DialogDescription>Live status, last seen, screenshot, and logs for {diagnosticsDisplay.name}</DialogDescription>
            </DialogHeader>
            {diagnosticsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : diagnostics ? (
              <div className="space-y-4">
                <div className="flex gap-6 items-center">
                  <div>
                    <span className={`px-2 py-1 rounded text-white ${diagnostics.status === 'online' ? 'bg-green-600' : diagnostics.status === 'offline' ? 'bg-red-600' : 'bg-yellow-600'}`}>{diagnostics.status}</span>
                    <div className="text-xs text-muted-foreground">Live Status</div>
                  </div>
                  <div>
                    <span className="font-mono">{diagnostics.lastSeen}</span>
                    <div className="text-xs text-muted-foreground">Last Seen</div>
                  </div>
                </div>
                {diagnosticsScreenshot && (
                  <div>
                    <img src={diagnosticsScreenshot} alt="Display Screenshot" className="border rounded w-full max-w-md" />
                    <div className="text-xs text-muted-foreground">Latest Screenshot</div>
                  </div>
                )}
                <div>
                  <div className="font-semibold mb-1">Logs</div>
                  <div className="bg-muted p-2 rounded text-xs max-h-40 overflow-auto">
                    {diagnosticsLogs.length > 0 ? diagnosticsLogs.map((log, i) => <div key={i}>{log}</div>) : <span>No logs available.</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div>No diagnostics available.</div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
