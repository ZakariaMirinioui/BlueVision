import { Card, CardContent } from "@/components/ui/card";
import { Monitor, Film, Clock, Settings } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { xiboService } from "@/services/XiboAPI";

const OverviewStats = () => {
  // Fetch displays using React Query
  const { data: displays = [] } = useQuery({
    queryKey: ["displays"],
    queryFn: () => xiboService.getDisplays(),
    refetchInterval: 60000,
  });

  // Fetch library size using real data
  const { data: mediaStats } = useQuery({
    queryKey: ["mediaStats"],
    queryFn: () => xiboService.getMediaStats(),
    refetchInterval: 60000,
  });

  // Compute display statistics using the 'status' field directly
  const displayStats = {
    total: displays.length || 0,
    active: displays.filter(d => d.status === "active").length || 0,
    online: displays.filter(d => d.status === "online").length || 0,
    offline: displays.filter(d => d.status === "offline").length || 0,
    error: displays.filter(d => d.status === "error").length || 0
  };

  // Xibo config info (example: API URL and last sync)
  const apiUrl = import.meta.env.VITE_SUPABASE_FUNCTION_URL || 'http://localhost:54321/functions/v1/xibo-api';
  const lastSync = displays.length > 0 ? new Date(Math.max(...displays.map(d => new Date(d.updated_at || d.created_at || 0).getTime()))).toLocaleString() : 'Never';

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Displays Card */}
      <Card className="border-none shadow-lg shadow-secondary/5 transition-all duration-300 hover:shadow-secondary/10">
        <CardContent className="p-6">
          <div>
            <div className="flex gap-3 mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Monitor className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Displays</p>
                <h3 className="text-3xl font-bold">{displayStats.total}</h3>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 pl-1">
              <div className="flex items-center justify-between">
                <StatusBadge status="active" showLabel={true} />
                <span className="text-sm font-medium">{displayStats.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <StatusBadge status="online" showLabel={true} />
                <span className="text-sm font-medium">{displayStats.online}</span>
              </div>
              <div className="flex items-center justify-between">
                <StatusBadge status="offline" showLabel={true} />
                <span className="text-sm font-medium">{displayStats.offline}</span>
              </div>
              <div className="flex items-center justify-between">
                <StatusBadge status="error" showLabel={true} />
                <span className="text-sm font-medium">{displayStats.error}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Library Size Card */}
      <Card className="border-none shadow-lg shadow-secondary/5 transition-all duration-300 hover:shadow-secondary/10">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="bg-blue-500/10 p-3 rounded-full">
              <Film className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Library Size</p>
              <div className="flex items-baseline gap-2">
                {mediaStats ? (
                  <>
                    <h3 className="text-3xl font-bold">{(mediaStats.totalSize / (1024 * 1024 * 1024)).toFixed(2)}</h3>
                    <span className="text-base">GB</span>
                  </>
                ) : (
                  <span>Loading...</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Now Playing Card */}
      <Card className="border-none shadow-lg shadow-secondary/5 transition-all duration-300 hover:shadow-secondary/10">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="bg-purple-500/10 p-3 rounded-full">
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">En lecture</p>
              <h3 className="text-3xl font-bold">{displayStats.active}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Performance Card */}
      <Card className="border-none shadow-lg shadow-secondary/5 transition-all duration-300 hover:shadow-secondary/10">
        <CardContent className="p-6">
          <div>
            <div className="flex gap-3 mb-4">
              <div className="bg-emerald-500/10 p-3 rounded-full">
                <Clock className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Performance</p>
                <h3 className="text-3xl font-bold text-emerald-600">
                  {Math.round(((displayStats.active + displayStats.online) / Math.max(displayStats.total, 1)) * 100)}%
                </h3>
              </div>
            </div>
            <div className="space-y-3 pl-1">
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground">System Status</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs font-medium text-emerald-600">Healthy</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground">Response Time</span>
                <span className="text-xs font-medium text-green-600">Fast</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground">Last Sync</span>
                <span className="text-xs font-medium truncate max-w-[80px]" title={lastSync}>
                  {new Date(lastSync !== 'Never' ? lastSync : Date.now()).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground">Active Displays</span>
                <span className="text-xs font-medium text-blue-600">
                  {displayStats.active + displayStats.online}/{displayStats.total}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewStats;
