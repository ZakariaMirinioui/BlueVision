import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, XCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// Nouveaux types de statut conformément à la demande
export type StatusType = "active" | "online" | "offline" | "error";

interface StatusBadgeProps {
  status: StatusType;
  count?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

const StatusBadge = ({ 
  status, 
  count, 
  showLabel = true, 
  size = "md",
  animate = true 
}: StatusBadgeProps) => {
  const getStatusDetails = () => {
    switch (status) {
      case "active":
        return {
          icon: Activity,
          label: "Active",
          variant: "outline",
          color: "text-emerald-500 dark:text-emerald-400",
          bgColor: "bg-emerald-500 dark:bg-emerald-400",
          borderColor: "border-emerald-500/20 dark:border-emerald-400/20",
          shadowColor: "shadow-emerald-500/10 dark:shadow-emerald-400/10",
        };
      case "online":
        return {
          icon: CheckCircle,
          label: "Online",
          variant: "outline",
          color: "text-blue-500 dark:text-blue-400",
          bgColor: "bg-blue-500 dark:bg-blue-400",
          borderColor: "border-blue-500/20 dark:border-blue-400/20",
          shadowColor: "shadow-blue-500/10 dark:shadow-blue-400/10",
        };
      case "offline":
        return {
          icon: XCircle,
          label: "Offline",
          variant: "outline",
          color: "text-gray-500 dark:text-gray-400",
          bgColor: "bg-gray-500 dark:bg-gray-400",
          borderColor: "border-gray-500/20 dark:border-gray-400/20",
          shadowColor: "shadow-gray-500/10 dark:shadow-gray-400/10",
        };
      case "error":
        return {
          icon: AlertCircle,
          label: "Error",
          variant: "outline",
          color: "text-red-500 dark:text-red-400",
          bgColor: "bg-red-500 dark:bg-red-400",
          borderColor: "border-red-500/20 dark:border-red-400/20",
          shadowColor: "shadow-red-500/10 dark:shadow-red-400/10",
        };
      default:
        return {
          icon: CheckCircle,
          label: "Online",
          variant: "outline",
          color: "text-blue-500 dark:text-blue-400",
          bgColor: "bg-blue-500 dark:bg-blue-400",
          borderColor: "border-blue-500/20 dark:border-blue-400/20",
          shadowColor: "shadow-blue-500/10 dark:shadow-blue-400/10",
        };
    }
  };

  const { icon: Icon, label, color, bgColor, borderColor, shadowColor } = getStatusDetails();

  // Tailles différentes selon le paramètre size
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-0.5 text-xs",
    lg: "px-2.5 py-1 text-sm"
  };

  // Taille du point de statut
  const dotSizes = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5"
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1.5 rounded-md transition-all duration-300",
        "border shadow-sm",
        borderColor,
        shadowColor,
        sizeClasses[size]
      )}
    >
      <span 
        className={cn(
          "rounded-full", 
          dotSizes[size], 
          bgColor,
          animate && "animate-pulse-status"
        )} 
      />
      {showLabel && <span className={cn("font-medium", color)}>{label}</span>}
      {count !== undefined && <span className="text-muted-foreground ml-0.5">({count})</span>}
    </Badge>
  );
};

export default StatusBadge;
