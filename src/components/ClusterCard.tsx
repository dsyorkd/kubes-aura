import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Server, 
  Box, 
  Cpu, 
  HardDrive, 
  MapPin, 
  Cloud,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClusterCardProps {
  cluster: {
    id: string;
    name: string;
    region: string;
    provider: string;
    status: "healthy" | "warning" | "critical" | "provisioning";
    nodes: number;
    pods: number;
    cpu: number;
    memory: number;
    version: string;
    createdAt: string;
  };
  viewMode: "grid" | "list";
  isSelected: boolean;
  onClick: () => void;
}

const statusConfig = {
  healthy: {
    icon: CheckCircle,
    color: "text-success",
    bg: "bg-success/10",
    label: "Healthy",
  },
  warning: {
    icon: AlertCircle,
    color: "text-warning",
    bg: "bg-warning/10",
    label: "Warning",
  },
  critical: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Critical",
  },
  provisioning: {
    icon: Loader2,
    color: "text-primary",
    bg: "bg-primary/10",
    label: "Provisioning",
  },
};

const providerIcons: Record<string, string> = {
  AWS: "☁️",
  GCP: "🔷",
  Azure: "⚡",
};

export function ClusterCard({ cluster, viewMode, isSelected, onClick }: ClusterCardProps) {
  const StatusIcon = statusConfig[cluster.status].icon;
  
  if (viewMode === "list") {
    return (
      <Card 
        className={cn(
          "p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01]",
          isSelected && "ring-2 ring-primary shadow-lg"
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className={cn("p-2 rounded-lg", statusConfig[cluster.status].bg)}>
              <StatusIcon className={cn("h-5 w-5", statusConfig[cluster.status].color, 
                cluster.status === "provisioning" && "animate-spin")} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg">{cluster.name}</h3>
                <Badge variant="outline" className="text-xs">
                  v{cluster.version}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {cluster.region}
                </span>
                <span className="flex items-center gap-1">
                  {providerIcons[cluster.provider]} {cluster.provider}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold">{cluster.nodes}</div>
                <div className="text-xs text-muted-foreground">Nodes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{cluster.pods}</div>
                <div className="text-xs text-muted-foreground">Pods</div>
              </div>
              
              <div className="w-32 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">CPU</span>
                  <span className="font-medium">{cluster.cpu}%</span>
                </div>
                <Progress value={cluster.cpu} className="h-1.5" />
              </div>
              
              <div className="w-32 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Memory</span>
                  <span className="font-medium">{cluster.memory}%</span>
                </div>
                <Progress value={cluster.memory} className="h-1.5" />
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Edit Configuration</DropdownMenuItem>
                <DropdownMenuItem>Scale Cluster</DropdownMenuItem>
                <DropdownMenuItem>View Logs</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Delete Cluster</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card 
      className={cn(
        "p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] group",
        isSelected && "ring-2 ring-primary shadow-lg"
      )}
      onClick={onClick}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{cluster.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{cluster.region}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {providerIcons[cluster.provider]} {cluster.provider}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={cn(
              "gap-1",
              statusConfig[cluster.status].bg,
              statusConfig[cluster.status].color,
              "border-0"
            )}>
              <StatusIcon className={cn("h-3 w-3", 
                cluster.status === "provisioning" && "animate-spin")} />
              {statusConfig[cluster.status].label}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Edit Configuration</DropdownMenuItem>
                <DropdownMenuItem>Scale Cluster</DropdownMenuItem>
                <DropdownMenuItem>View Logs</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Delete Cluster</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Server className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{cluster.nodes}</div>
              <div className="text-xs text-muted-foreground">Nodes</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Box className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{cluster.pods}</div>
              <div className="text-xs text-muted-foreground">Pods</div>
            </div>
          </div>
        </div>
        
        {/* Resource Usage */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Cpu className="h-3 w-3" />
                CPU Usage
              </span>
              <span className="font-medium">{cluster.cpu}%</span>
            </div>
            <Progress value={cluster.cpu} className="h-2" />
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <HardDrive className="h-3 w-3" />
                Memory Usage
              </span>
              <span className="font-medium">{cluster.memory}%</span>
            </div>
            <Progress value={cluster.memory} className="h-2" />
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <Badge variant="outline" className="text-xs">
            v{cluster.version}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Created {cluster.createdAt}
          </span>
        </div>
      </div>
    </Card>
  );
}