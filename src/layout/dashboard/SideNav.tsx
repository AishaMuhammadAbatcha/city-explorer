import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Search, Settings, LogOut, Map, History, Bookmark, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const sideNavRef = useRef<HTMLDivElement>(null);
  const collapsedWidth = 64;

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

  const navItems = [
    { text: "Search", link: "/search", icon: Search },
    { text: "History", link: "/history", icon: History },
    { text: "Saved", link: "/saved", icon: Bookmark },
    { text: "Usage", link: "/usage", icon: BarChart3 },
    { text: "Settings", link: "/settings", icon: Settings },
  ];

  const mobileDrawer = (
    <div className="flex flex-col h-full bg-blue-50 dark:bg-gray-800 border-r border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Map className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground whitespace-nowrap">
              TR-ACE
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDrawerToggle}
            className="sm:hidden flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.link;
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
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">{item.text}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full"
          disabled={isLoading}
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="whitespace-nowrap">{isLoading ? "Signing out..." : "Sign out"}</span>
        </Button>
      </div>
    </div>
  );

  const desktopDrawer = (
    <div
      className="flex flex-col h-full bg-blue-50 dark:bg-gray-800 border-r border-border transition-all duration-300 ease-in-out sidebar-hover-indicator"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={cn(
        "border-b border-border transition-all duration-300 flex items-center",
        isExpanded ? "p-6" : "p-4 justify-center"
      )}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Map className="w-4 h-4 text-white" />
          </div>
          <span className={cn(
            "text-lg font-bold text-foreground whitespace-nowrap transition-all duration-300 overflow-hidden",
            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
          )}>
            TR-ACE
          </span>
        </div>
      </div>

      <nav className={cn(
        "flex-1 transition-all duration-300",
        isExpanded ? "p-4" : "p-2"
      )}>
        <ul className="space-y-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.link;
            const Icon = item.icon;

            return (
              <li key={index}>
                <NavLink
                  to={item.link}
                  className={cn(
                    "flex items-center rounded-lg text-sm transition-all hover:bg-blue-100 dark:hover:bg-blue-900",
                    isExpanded ? "gap-3 px-3 py-2" : "justify-center p-3",
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300"
                  )}
                  title={!isExpanded ? item.text : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className={cn(
                    "font-medium whitespace-nowrap transition-all duration-300 overflow-hidden",
                    isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                  )}>
                    {item.text}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={cn(
        "border-t border-border transition-all duration-300",
        isExpanded ? "p-4" : "p-2"
      )}>
        <Button
          variant="outline"
          className={cn(
            "w-full transition-all duration-300",
            isExpanded ? "" : "px-3"
          )}
          disabled={isLoading}
          onClick={handleLogout}
          title={!isExpanded ? "Sign out" : undefined}
        >
          <LogOut className={cn(
            "h-4 w-4 flex-shrink-0",
            isExpanded ? "mr-2" : ""
          )} />
          <span className={cn(
            "whitespace-nowrap transition-all duration-300 overflow-hidden",
            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
          )}>
            {isLoading ? "Signing out..." : "Sign out"}
          </span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={`
          fixed inset-0 bg-black/50 z-30 sm:hidden
          transition-opacity duration-300 ease-in-out
          ${mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        aria-hidden="true"
      />

      <nav
        style={{
          "--drawer-width": `${drawerWidth}px`,
          "--collapsed-width": `${collapsedWidth}px`
        } as React.CSSProperties}
      >
        <div
          ref={sideNavRef}
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-[var(--drawer-width)] transform transition-transform duration-300 ease-in-out sm:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {mobileDrawer}
        </div>

        <div
          className={cn(
            "hidden sm:block fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out",
            isExpanded ? "w-[var(--drawer-width)]" : "w-[var(--collapsed-width)]"
          )}
        >
          {desktopDrawer}
        </div>
      </nav>
    </>
  );
}

export default SideNav;
