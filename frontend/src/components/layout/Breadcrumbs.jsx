import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const routeLabels = {
  dashboard: "Dashboard",
  tickets: "Tickets",
  create: "Create Ticket",
  technician: "Technician Panel",
  admin: "Admin Panel",
  users: "User Management",
  "knowledge-base": "Knowledge Base",
  profile: "Profile",
  settings: "Settings",
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  if (pathSegments.length === 0) return null;

  return (
    <nav className="flex items-center text-sm text-muted-foreground mb-4">
      <Link
        to="/dashboard"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {pathSegments.map((segment, index) => {
        const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
        const isLast = index === pathSegments.length - 1;
        const label = routeLabels[segment] || segment;

        // Skip numeric IDs in breadcrumbs (e.g., /tickets/123)
        const isId = /^\d+$/.test(segment) || segment.length > 20;

        return (
          <span key={path} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            {isLast ? (
              <span className="font-medium text-foreground">
                {isId ? `#${segment.slice(0, 8)}` : label}
              </span>
            ) : (
              <Link
                to={path}
                className="hover:text-foreground transition-colors"
              >
                {isId ? `#${segment.slice(0, 8)}` : label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
