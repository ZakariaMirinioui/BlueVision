// Filtering options
const ACTION_TYPES = ["create", "edit", "delete", "upload"];
const ENTITY_TYPES = ["display", "layout", "media", "schedule"];
const ACTION_ICONS: Record<string, JSX.Element> = {
  create: <FilePlus className="h-5 w-5" />,
  delete: <FilePlus className="h-5 w-5" />,
  edit: <FilePlus className="h-5 w-5" />,
  upload: <FilePlus className="h-5 w-5" />,
};

type RawActivity = ActivityLog & { [key: string]: unknown };

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { xiboService } from "@/services/XiboAPI";
import { cn } from "@/lib/utils";
import { FilePlus, ChevronDown } from "lucide-react";

// Activity log entry type
interface ActivityLog {
  id: string | number;
  created_at?: string | null;
  user_id?: string | number | null;
  action_type?: string | null;
  entity?: string | null;
  entity_id?: string | number | null;
  description?: string | null;
  meta?: Record<string, unknown>;
}

const RecentActivities = () => {
  const [actionTypeFilter, setActionTypeFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [userMap, setUserMap] = useState<Record<string, { username: string }>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch all users for mapping user_id to username
  useEffect(() => {
    (async () => {
      const users = await xiboService.getUsers();
      const map: Record<string, { username: string }> = {};
      users.forEach((u: { auth_uid?: string | number, username: string }) => {
        // Always use auth_uid as the key for mapping, since activities.user_id is a string uuid
        if (u.auth_uid) map[String(u.auth_uid)] = { username: u.username };
      });
      setUserMap(map);
    })();
  }, []);

  // Debounce search input
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
      // Do NOT force focus here; let the input remain naturally focused
    }, 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ["recentActivities", actionTypeFilter, entityTypeFilter, debouncedSearch],
    queryFn: async () => {
      const all = await xiboService.getRecentActivities(100);
      // Map to ActivityLog type
      const mapped: ActivityLog[] = (all as RawActivity[]).map((a) => ({
        id: a.id,
        created_at: a.created_at ?? undefined,
        user_id: a.user_id ?? undefined,
        action_type: a.action_type ?? undefined,
        entity: a.entity ?? undefined,
        entity_id: a.entity_id ?? undefined,
        description: a.description ?? undefined,
        meta: a.meta ?? undefined,
      }));
      return mapped.filter((a) => {
        const matchesAction = !actionTypeFilter || a.action_type === actionTypeFilter;
        const matchesEntity = !entityTypeFilter || a.entity === entityTypeFilter;
        // Search by username instead of user_id
        const username = a.user_id && userMap[a.user_id] ? userMap[a.user_id].username.toLowerCase() : "";
        const matchesSearch = !debouncedSearch || (
          (a.description && a.description.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
          (username && username.includes(debouncedSearch.toLowerCase()))
        );
        return matchesAction && matchesEntity && matchesSearch;
      });
    },
    refetchInterval: 60000,
  });




  // State for confirmation dialog
  const [showConfirm, setShowConfirm] = useState(false);
  // Handler to clear all logs
  const handleClearAll = async () => {
    setShowConfirm(false);
    // @ts-expect-error: fallback for missing type
    if (typeof xiboService.clearAllActivities === 'function') {
      // @ts-expect-error: fallback for missing type
      await xiboService.clearAllActivities();
    } else {
      alert('Clear all logs functionality is not implemented.');
    }
    window.location.reload();
  };

  // State for single log delete confirmation
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Handler to delete a single log
  const handleDeleteLog = async (id: string | number) => {
    setDeleting(true);
    try {
      await xiboService.deleteActivity(id);
      setDeleteId(null);
      // Optionally, refetch activities here if using react-query
      window.location.reload();
    } catch (err) {
      alert('Failed to delete log.');
      setDeleting(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!activities || error) return <div className="text-muted-foreground">No activity logs available.</div>;

  // State for confirmation dialog

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 relative">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <input
            key="log-search-input"
            ref={searchInputRef}
            type="text"
            placeholder="Search by user or log details..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition w-full sm:w-64 shadow-sm"
          />
          <select value={actionTypeFilter} onChange={e => setActionTypeFilter(e.target.value)} className="rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition shadow-sm">
            <option value="">All Actions</option>
            {ACTION_TYPES.map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
          </select>
          <select value={entityTypeFilter} onChange={e => setEntityTypeFilter(e.target.value)} className="rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition shadow-sm">
            <option value="">All Entities</option>
            {ENTITY_TYPES.map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
          </select>
        </div>
        {/* Actions: Refresh and Clear */}
        <div className="flex flex-col items-end gap-2 absolute right-0 top-0 md:static">
          {/* The refresh button is rendered by the parent Dashboard, so nothing here for refresh */}
          <button
            onClick={() => setShowConfirm(true)}
            className="mt-2 px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium shadow hover:bg-destructive/90 transition"
          >
            Clear All Logs
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#272b34] rounded-lg shadow-lg p-6 w-full max-w-sm">
            <div className="font-semibold text-lg mb-2 dark:text-white">Confirm Clear All Logs</div>
            <div className="mb-4 text-sm text-muted-foreground dark:text-gray-200">Are you sure you want to delete all activity logs? This action cannot be undone.</div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-muted text-foreground hover:bg-muted/80 transition dark:bg-gray-800 dark:text-white"
                onClick={() => setShowConfirm(false)}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded bg-destructive text-white hover:bg-destructive/90 transition dark:bg-red-700 dark:text-white"
                onClick={handleClearAll}
              >Delete All</button>
            </div>
          </div>
        </div>
      )}
      {/* Activity Log List */}
      {activities.length === 0 ? (
        <div className="text-muted-foreground">No logs match your filters.</div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => {
            const isExpanded = expandedId === activity.id;
            const icon = ACTION_ICONS[activity.action_type ?? ""] || <FilePlus className="h-5 w-5" />;
            // Generate a structured title for each action/entity
            let title = activity.description || activity.entity || activity.id || "Activity";
            function isMediaMeta(meta: unknown): meta is { media?: { name?: string }; name?: string } {
              return typeof meta === 'object' && meta !== null && ('media' in meta || 'name' in meta);
            }
            function isLayoutMeta(meta: unknown): meta is { layout?: { name?: string } } {
              return typeof meta === 'object' && meta !== null && 'layout' in meta;
            }
            function isScheduleMeta(meta: unknown): meta is { schedule?: { campaign?: string }, scheduleName?: string } {
              return typeof meta === 'object' && meta !== null && ('schedule' in meta || 'scheduleName' in meta);
            }

            if (activity.entity === "media" && activity.action_type === "upload" && isMediaMeta(activity.meta) && activity.meta.media?.name) {
              title = `Media "${activity.meta.media.name}" has been successfully uploaded to your library.`;
            } else if (activity.entity === "media" && activity.action_type === "edit" && isMediaMeta(activity.meta) && activity.meta.name) {
              title = `Media "${activity.meta.name}" has been updated.`;
            } else if (activity.entity === "media" && activity.action_type === "delete" && isMediaMeta(activity.meta) && activity.meta.media?.name) {
              title = `Media "${activity.meta.media.name}" has been deleted from your library.`;
            } else if (activity.entity === "layout" && activity.action_type === "create" && isLayoutMeta(activity.meta) && activity.meta.layout?.name) {
              title = `Layout "${activity.meta.layout.name}" has been created.`;
            } else if (activity.entity === "layout" && activity.action_type === "edit" && isLayoutMeta(activity.meta) && activity.meta.layout?.name) {
              title = `Layout "${activity.meta.layout.name}" has been updated.`;
            } else if (activity.entity === "layout" && activity.action_type === "delete" && isLayoutMeta(activity.meta) && activity.meta.layout?.name) {
              title = `Layout "${activity.meta.layout.name}" has been deleted.`;
            } else if (activity.entity === "schedule" && activity.action_type === "create" && isScheduleMeta(activity.meta) && activity.meta.schedule?.campaign) {
              title = `Schedule "${activity.meta.schedule.campaign}" has been created.`;
            } else if (activity.entity === "schedule" && activity.action_type === "edit" && isScheduleMeta(activity.meta) && activity.meta.schedule?.campaign) {
              title = `Schedule "${activity.meta.schedule.campaign}" has been updated.`;
            } else if (activity.entity === "schedule" && activity.action_type === "delete" && isScheduleMeta(activity.meta) && activity.meta.scheduleName) {
              title = `Schedule "${activity.meta.scheduleName}" has been deleted.`;
            }

            // Structured details for known entities
            let details: { label: string, value: string }[] = [];
            function isFullMediaMeta(meta: unknown): meta is { media: { name?: string, type?: string, file_size?: string, created_at?: string } } {
              return (
                typeof meta === 'object' && meta !== null &&
                'media' in meta &&
                typeof (meta as { media?: unknown }).media === 'object' &&
                (meta as { media?: unknown }).media !== null
              );
            }
            function isFullLayoutMeta(meta: unknown): meta is { layout: { name?: string, status?: string, created_at?: string } } {
              return (
                typeof meta === 'object' && meta !== null &&
                'layout' in meta &&
                typeof (meta as { layout?: unknown }).layout === 'object' &&
                (meta as { layout?: unknown }).layout !== null
              );
            }
            function isFullScheduleMeta(meta: unknown): meta is { schedule: { campaign?: string, from_dt?: string, to_dt?: string, created_at?: string } } {
              return (
                typeof meta === 'object' && meta !== null &&
                'schedule' in meta &&
                typeof (meta as { schedule?: unknown }).schedule === 'object' &&
                (meta as { schedule?: unknown }).schedule !== null
              );
            }

            if (activity.entity === "media" && isFullMediaMeta(activity.meta)) {
              const m = activity.meta.media;
              details = [
                { label: "name", value: m.name ?? "" },
                { label: "type", value: m.type ?? "" },
                { label: "size", value: m.file_size ? m.file_size + " bytes" : "" },
                { label: "created_at", value: m.created_at ?? "" },
              ];
            } else if (activity.entity === "layout" && isFullLayoutMeta(activity.meta)) {
              const l = activity.meta.layout;
              details = [
                { label: "name", value: l.name ?? "" },
                { label: "status", value: l.status ?? "" },
                { label: "created_at", value: l.created_at ?? "" },
              ];
            } else if (activity.entity === "schedule" && isFullScheduleMeta(activity.meta)) {
              const s = activity.meta.schedule;
              details = [
                { label: "campaign", value: s.campaign ?? "" },
                { label: "from", value: s.from_dt ?? "" },
                { label: "to", value: s.to_dt ?? "" },
                { label: "created_at", value: s.created_at ?? "" },
              ];
            } else if (activity.entity === "display" && typeof activity.meta === 'object' && activity.meta !== null) {
              const d = activity.meta as { name?: string, status?: string, location?: string, group_name?: string };
              details = [
                { label: "name", value: d.name ?? "" },
                { label: "status", value: d.status ?? "" },
                { label: "location", value: d.location ?? "" },
                { label: "group_name", value: d.group_name ?? "" },
              ];
            }

            // Show changed fields for edit actions
            let changedFields: { field: string, previous: string, current: string }[] = [];
            if (activity.action_type === "edit" && typeof activity.meta === 'object' && activity.meta !== null && 'changedFields' in activity.meta) {
              const cf = (activity.meta as { changedFields?: Record<string, { previous: string, current: string }> }).changedFields;
              if (cf) {
                changedFields = Object.keys(cf).map(field => ({
                  field,
                  previous: cf[field].previous,
                  current: cf[field].current
                }));
              }
            }


            // Get username for this activity
            let username = "";
            if (activity.user_id !== undefined && activity.user_id !== null) {
              const key = String(activity.user_id);
              if (userMap[key] && userMap[key].username) {
                username = userMap[key].username;
              }
            }

            return (
              <div key={activity.id} className={cn("rounded-lg border bg-card p-4 shadow-sm transition hover:shadow-md cursor-pointer", isExpanded && "ring-2 ring-primary/30")}
                onClick={() => setExpandedId(isExpanded ? null : activity.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    activity.action_type === "create" && "bg-green-100 text-green-600",
                    activity.action_type === "delete" && "bg-red-100 text-red-600",
                    activity.action_type === "edit" && "bg-yellow-100 text-yellow-700",
                    activity.action_type === "upload" && "bg-blue-100 text-blue-600",
                    !activity.action_type && "bg-primary/10 text-primary"
                  )}>{icon}</div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="font-semibold text-base text-foreground">{title}</span>
                      <span className="text-xs text-muted-foreground">{activity.created_at ? new Date(activity.created_at).toLocaleString() : ""}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                      {username && (
                        <span className="bg-muted px-2 py-0.5 rounded">username: <b>{username}</b></span>
                      )}
                      <span className="bg-muted px-2 py-0.5 rounded">Action: {activity.action_type ?? 'N/A'}</span>
                      <span className="bg-muted px-2 py-0.5 rounded">Entity: {activity.entity ?? 'N/A'}</span>
                      {activity.entity_id && <span className="bg-muted px-2 py-0.5 rounded">ID: {activity.entity_id}</span>}
                    </div>
                  </div>
                  <button className="ml-2 p-1 rounded hover:bg-primary/10 transition" tabIndex={-1} onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : activity.id); }}>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded ? "rotate-180" : "rotate-0")} />
                  </button>
                </div>
                {isExpanded && changedFields.length > 0 && (
                  <div className="mt-4 bg-muted/50 rounded p-3 text-xs text-foreground/80">
                    <div className="font-semibold mb-1">Modified Fields</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {changedFields.map(({ field, previous, current }) => (
                        <div key={field} className="flex flex-col">
                          <span className="font-medium text-foreground/90">{field}</span>
                          <span className="break-all text-muted-foreground">Previous: {previous}</span>
                          <span className="break-all text-green-700">Current: {current}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {isExpanded && changedFields.length === 0 && details.length > 0 && (
                  <div className="mt-4 bg-muted/50 rounded p-3 text-xs text-foreground/80">
                    <div className="font-semibold mb-1">Details</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {details.map(({ label, value }) => (
                        <div key={label} className="flex flex-col">
                          <span className="font-medium text-foreground/90">{label}</span>
                          <span className="break-all text-muted-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {isExpanded && changedFields.length === 0 && details.length === 0 && activity.meta && (
                  <div className="mt-4 bg-muted/50 rounded p-3 text-xs text-foreground/80">

                    <div className="font-semibold mb-1">Details</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(activity.meta).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <span className="font-medium text-foreground/90">{key}</span>
                          <span className="break-all text-muted-foreground">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {isExpanded && (
                  <div className="mt-4 flex justify-end">
                    <button
                      className="px-3 py-1 rounded bg-destructive text-white text-xs font-semibold shadow hover:bg-destructive/90 transition"
                      onClick={e => { e.stopPropagation(); setDeleteId(activity.id); }}
                    >Delete Log</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#272b34] rounded-lg shadow-lg p-6 w-full max-w-sm">
            <div className="font-semibold text-lg mb-2 dark:text-white">Confirm Delete Log</div>
            <div className="mb-4 text-sm text-muted-foreground dark:text-gray-200">Are you sure you want to delete this activity log? This action cannot be undone.</div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-muted text-foreground hover:bg-muted/80 transition dark:bg-gray-800 dark:text-white"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded bg-destructive text-white hover:bg-destructive/90 transition dark:bg-red-700 dark:text-white"
                onClick={() => handleDeleteLog(deleteId!)}
                disabled={deleting}
              >{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentActivities;
