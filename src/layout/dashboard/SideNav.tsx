import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Home,
  Compass,
  Bot,
  Map,
  User,
  Calendar,
  Tag,
  Star,
  BarChart3,
  Bell,
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

// Import your logo assets
import { NavLink, useLocation, useNavigate } from "react-router";

type Props = {
  drawerWidth: number;
  handleDrawerToggle: () => void;
  mobileOpen: boolean;
};

function SideNav({ drawerWidth, handleDrawerToggle, mobileOpen }: Props) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const sideNavRef = useRef<HTMLDivElement>(null);
  const userRole: "admin" | "individual" | "organization" = "individual"; // Temporary user role assignment for development purposes

  // Handle click outside to close mobile drawer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileOpen &&
        sideNavRef.current &&
        !sideNavRef.current.contains(event.target as Node)
      ) {
        handleDrawerToggle();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileOpen, handleDrawerToggle]);

  const handleLogout = async () => {
    setIsLoading(true);
    await signOut();
    navigate("/login");
    setIsLoading(false);
  };

  const adminNavItems = [
    {
      text: "Dashboard",
      link: "/dashboard",
      icon: Home,
    },
    {
      text: "Add Number",
      link: "/add-number",
      icon: Settings,
    },
  ];

  const individualNavItems = [
    {
      text: "Home",
      link: "/dashboard",
      icon: Home,
    },
    {
      text: "Explore",
      link: "/explore",
      icon: Compass,
    },
    {
      text: "Explore AI",
      link: "/ai",
      icon: Bot,
    },
    {
      text: "Maps",
      link: "/maps",
      icon: Map,
    },
    {
      text: "Profile",
      link: "/settings",
      icon: User,
    },
  ];

  const organizationNavItems = [
    {
      text: "Dashboard",
      link: "/dashboard",
      icon: Home,
    },
    {
      text: "Events",
      link: "/events",
      icon: Calendar,
    },
    {
      text: "Deals",
      link: "/deals",
      icon: Tag,
    },
    {
      text: "Reviews",
      link: "/reviews",
      icon: Star,
    },
    {
      text: "Analytics",
      link: "/analytics",
      icon: BarChart3,
    },
    {
      text: "Notifications",
      link: "/notifications",
      icon: Bell,
    },
    {
      text: "Settings",
      link: "/settings",
      icon: Settings,
    },
  ];

  // const navItems =
  //   user?.role === "admin"
  //     ? adminNavItems
  //     : user?.role === "individual"
  //     ? individualNavItems
  //     : organizationNavItems;

  const getUserNavItems = (role: "admin" | "individual" | "organization") => {
    switch (role) {
      case "admin":
        return adminNavItems;
      case "individual":
        return individualNavItems;
      case "organization":
        return organizationNavItems;
      default:
        return organizationNavItems;
    }
  };

  const navItems = getUserNavItems(userRole);

  const drawer = (
    <div className="flex flex-col h-full bg-blue-50 dark:bg-blue-950 border-r border-border">
      {/* Logo section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Map className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">
              City Explorer
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDrawerToggle}
            className="sm:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.link ||
              (item.link !== "/dashboard" && location.pathname.startsWith(item.link));
            const Icon = item.icon;

            return (
              <li key={index}>
                <NavLink
                  to={item.link}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-blue-100 dark:hover:bg-blue-900",
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300"
                  )}
                  onClick={handleDrawerToggle}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.text}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full"
          disabled={isLoading}
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoading ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay for mobile when drawer is open */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-30 sm:hidden
          transition-opacity duration-300 ease-in-out
          ${mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        aria-hidden="true"
      />

      <nav
        style={{ "--drawer-width": `${drawerWidth}px` } as React.CSSProperties}
        className="sm:w-[var(--drawer-width)] sm:flex-shrink-0"
      >
        {/* Mobile drawer */}
        <div
          ref={sideNavRef}
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-[var(--drawer-width)] transform transition-transform duration-300 ease-in-out sm:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {drawer}
        </div>

        {/* Desktop permanent drawer */}
        <div className="hidden sm:block fixed inset-y-0 left-0 z-40 w-[var(--drawer-width)]">
          {drawer}
        </div>
      </nav>
    </>
  );
}

export default SideNav;
