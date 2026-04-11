import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Monitor,
  Layers,
  HelpCircle,
  Settings,
  User,
  Info,
  Calendar,
  LifeBuoy,
  Moon,
  Sun,
  Upload,
  Users,
  Shield,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenu,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { RoleBasedNavigation } from "@/components/auth/RoleBasedNavigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Badge } from "@/components/ui/badge";

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("theme");
  if (saved) return saved;
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
};

const mainNavItems = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
];

const contentItems = [
  {
    title: "Media Library",
    path: "/media-library",
    icon: Upload,
  },
  {
    title: "Layouts",
    path: "/layouts",
    icon: Layers,
  },
  {
    title: "Schedules",
    path: "/schedules",
    icon: Calendar,
  },
];

const displayItems = [
  {
    title: "Displays",
    path: "/displays",
    icon: Monitor,
  },
];

const userItems = [
  {
    title: "Profile",
    path: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
  },
  {
    title: "About",
    path: "/about",
    icon: Info,
  },
  {
    title: "Support",
    path: "/support",
    icon: LifeBuoy,
  },
];

// Management items for managers and admins
const managementItems = [
  {
    title: "All Schedules",
    path: "/all-schedules",
    icon: Calendar,
  },
  {
    title: "All Media",
    path: "/all-media",
    icon: Upload,
  },
  {
    title: "All Layouts",
    path: "/all-layouts",
    icon: Layers,
  },
  {
    title: "All Displays",
    path: "/all-displays",
    icon: Monitor,
  },
];

// Admin items for admins only
const adminItems = [
  {
    title: "User Management",
    path: "/users",
    icon: Users,
  },
  {
    title: "System Settings",
    path: "/system-settings",
    icon: Database,
  },
];

export default function AppSidebar() {
  const location = useLocation();
  const [theme, setTheme] = useState(getInitialTheme());
  const { profile } = useAuthStore();

  useEffect(() => {
    document.documentElement.classList.add('theme-transition');
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);

    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 200);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <Sidebar collapsible="icon">
      <div className="flex flex-col h-full">
        <SidebarHeader className="sidebar-header flex-shrink-0">
          <div className="flex items-center justify-center w-full p-3">
            <div className="logo-container flex items-center gap-3 px-2">
              <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 500 500">
                  <path fill="#4477FF" d="M250 100C150 100 67 170 50 262C45 290 45 310 50 338C67 430 150 500 250 500C350 500 433 430 450 338C455 310 455 290 450 262C433 170 350 100 250 100Z" />
                  <path fill="#FFFFFF" d="M250 150C180 150 120 210 120 280C120 350 180 410 250 410C320 410 380 350 380 280C380 210 320 150 250 150Z" />
                  <circle fill="#4477FF" cx="250" cy="280" r="80" />
                </svg>
              </div>
              <div className="sidebar-text overflow-hidden">
                <span className="font-semibold text-lg bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent whitespace-nowrap">
                  Blue Vision
                </span>
              </div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.path}
                        className={`hover:bg-primary/10 transition-all duration-200 ${location.pathname === item.path
                          ? 'bg-primary/20 dark:text-primary dark:shadow-sm dark:shadow-primary/20'
                          : ''
                          }`}
                      >
                        <item.icon className={`h-5 w-5 transition-transform duration-200 ${location.pathname === item.path
                          ? 'scale-110 text-primary'
                          : ''
                          }`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Content</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {contentItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.path}
                        className={`hover:bg-primary/10 transition-all duration-200 ${location.pathname === item.path
                          ? 'bg-primary/20 dark:text-primary dark:shadow-sm dark:shadow-primary/20'
                          : ''
                          }`}
                      >
                        <item.icon className={`h-5 w-5 transition-transform duration-200 ${location.pathname === item.path
                          ? 'scale-110 text-primary'
                          : ''
                          }`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Devices</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {displayItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.path}
                        className={`hover:bg-primary/10 transition-all duration-200 ${location.pathname === item.path
                          ? 'bg-primary/20 dark:text-primary dark:shadow-sm dark:shadow-primary/20'
                          : ''
                          }`}
                      >
                        <item.icon className={`h-5 w-5 transition-transform duration-200 ${location.pathname === item.path
                          ? 'scale-110 text-primary'
                          : ''
                          }`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Management section - visible to managers and admins */}
          <RoleBasedNavigation allowedRoles={['manager', 'admin']}>
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managementItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link
                          to={item.path}
                          className={`hover:bg-primary/10 transition-all duration-200 ${location.pathname === item.path
                            ? 'bg-primary/20 dark:text-primary dark:shadow-sm dark:shadow-primary/20'
                            : ''
                            }`}
                        >
                          <item.icon className={`h-5 w-5 transition-transform duration-200 ${location.pathname === item.path
                            ? 'scale-110 text-primary'
                            : ''
                            }`} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </RoleBasedNavigation>

          {/* Admin section - visible to admins only */}
          <RoleBasedNavigation allowedRoles={['admin']}>
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link
                          to={item.path}
                          className={`hover:bg-primary/10 transition-all duration-200 ${location.pathname === item.path
                            ? 'bg-primary/20 dark:text-primary dark:shadow-sm dark:shadow-primary/20'
                            : ''
                            }`}
                        >
                          <item.icon className={`h-5 w-5 transition-transform duration-200 ${location.pathname === item.path
                            ? 'scale-110 text-primary'
                            : ''
                            }`} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </RoleBasedNavigation>

          <SidebarGroup>
            <SidebarGroupLabel>User</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.path}
                        className={`hover:bg-primary/10 transition-all duration-200 ${location.pathname === item.path
                          ? 'bg-primary/20 dark:text-primary dark:shadow-sm dark:shadow-primary/20'
                          : ''
                          }`}
                      >
                        <item.icon className={`h-5 w-5 transition-transform duration-200 ${location.pathname === item.path
                          ? 'scale-110 text-primary'
                          : ''
                          }`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 flex-shrink-0">
          <div className="sidebar-footer-buttons flex flex-col items-end gap-3 pr-2">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Toggle theme"
              onClick={handleThemeToggle}
              className="w-10 h-10 rounded-xl hover:bg-primary/10 hover:scale-105 transition-all duration-200"
            >
              <span className="transition-transform duration-500 rotate-0 dark:rotate-180">
                {theme === "dark" ? (
                  <Moon className="h-5 w-5 transition-all" />
                ) : (
                  <Sun className="h-5 w-5 transition-all" />
                )}
              </span>
            </Button>
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
