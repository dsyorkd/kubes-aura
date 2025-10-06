import { Home, Network, Cpu, Settings, Activity, BookOpen, HelpCircle, Rocket } from "lucide-react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/pi-controller", icon: Home },
  { title: "Clusters", url: "/pi-controller/clusters", icon: Network },
  { title: "Hardware", url: "/pi-controller/hardware", icon: Cpu },
  { title: "Settings", url: "/pi-controller/settings", icon: Settings },
];

const helpItems = [
  { title: "Getting Started", url: "/pi-controller/getting-started", icon: Rocket },
  { title: "Documentation", url: "/pi-controller/documentation", icon: BookOpen },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const [showGettingStarted, setShowGettingStarted] = useState(() => {
    return localStorage.getItem("hideGettingStarted") !== "true";
  });

  // Extract nodeId and clusterId from URL
  const pathParts = location.pathname.split('/');
  const clusterIndex = pathParts.indexOf('clusters');
  const nodeIndex = pathParts.indexOf('nodes');
  const clusterId = clusterIndex >= 0 ? pathParts[clusterIndex + 1] : null;
  const nodeId = nodeIndex >= 0 ? pathParts[nodeIndex + 1] : null;

  useEffect(() => {
    const handleVisibilityChange = () => {
      setShowGettingStarted(localStorage.getItem("hideGettingStarted") !== "true");
    };

    window.addEventListener("gettingStartedVisibilityChanged", handleVisibilityChange);
    return () => window.removeEventListener("gettingStartedVisibilityChanged", handleVisibilityChange);
  }, []);

  // Build dynamic menu items based on context
  let displayMainItems = [...mainItems];
  
  // Add Hardware link only when viewing a specific node
  if (nodeId && clusterId) {
    const hardwareItem = { 
      title: "Hardware", 
      url: `/pi-controller/clusters/${clusterId}/nodes/${nodeId}/hardware`, 
      icon: Cpu 
    };
    // Remove generic Hardware link and add node-specific one
    displayMainItems = displayMainItems.filter(item => item.title !== "Hardware");
    displayMainItems.splice(2, 0, hardwareItem);
  } else {
    // Remove Hardware from main menu when not viewing a node
    displayMainItems = displayMainItems.filter(item => item.title !== "Hardware");
  }

  if (showGettingStarted) {
    displayMainItems = [{ title: "Getting Started", url: "/pi-controller/getting-started", icon: Rocket }, ...displayMainItems];
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {open && <span>Pi Controller</span>}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {displayMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/pi-controller"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : ""
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              {open && <span>Help</span>}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {helpItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : ""
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
