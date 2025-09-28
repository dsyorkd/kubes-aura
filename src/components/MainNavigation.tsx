import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Cpu, 
  Network, 
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navItems: NavigationItem[] = [
  {
    label: "Kubernetes Clusters",
    href: "/",
    icon: Network,
    description: "Manage K8s clusters"
  },
  {
    label: "Pi Controller", 
    href: "/pi-controller",
    icon: Cpu,
    description: "Hardware monitoring & GPIO"
  }
];

export function MainNavigation() {
  const location = useLocation();
  
  return (
    <nav className="flex items-center gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href || 
          (item.href !== "/" && location.pathname.startsWith(item.href));
        
        return (
          <Link key={item.href} to={item.href}>
            <Button
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={cn(
                "gap-2 h-8",
                isActive && "bg-gradient-primary text-white hover:opacity-90"
              )}
              title={item.description}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}