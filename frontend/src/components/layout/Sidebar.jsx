import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TicketPlus,
  ListTodo,
  KanbanSquare,
  ShieldCheck,
  Users,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useAuthStore from "@/stores/authStore";
import { ROLES } from "@/lib/constants";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    roles: [ROLES.USER, ROLES.TECHNICIAN, ROLES.MANAGER, ROLES.ADMIN],
  },
  {
    label: "Create Ticket",
    icon: TicketPlus,
    path: "/tickets/create",
    roles: [ROLES.USER, ROLES.TECHNICIAN, ROLES.MANAGER, ROLES.ADMIN],
  },
  {
    label: "All Tickets",
    icon: ListTodo,
    path: "/tickets",
    roles: [ROLES.USER, ROLES.TECHNICIAN, ROLES.MANAGER, ROLES.ADMIN],
  },
  {
    label: "My Board",
    icon: KanbanSquare,
    path: "/technician",
    roles: [ROLES.TECHNICIAN, ROLES.MANAGER, ROLES.ADMIN],
  },
  {
    label: "Admin Panel",
    icon: ShieldCheck,
    path: "/admin",
    roles: [ROLES.ADMIN],
  },
  {
    label: "User Management",
    icon: Users,
    path: "/admin/users",
    roles: [ROLES.ADMIN],
  },
  {
    label: "Knowledge Base",
    icon: BookOpen,
    path: "/knowledge-base",
    roles: [ROLES.USER, ROLES.TECHNICIAN, ROLES.MANAGER, ROLES.ADMIN],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuthStore();
  const location = useLocation();
  const userRole = user?.role || ROLES.USER;

  const filteredItems = menuItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-sidebar-background text-sidebar-foreground transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Headphones className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">IntelliDesk</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {filteredItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/tickets"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2"
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t p-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
