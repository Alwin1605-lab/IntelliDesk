import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";
import UserProfileDropdown from "./UserProfileDropdown";
import ThemeToggle from "./ThemeToggle";

export default function TopNavbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <div className="flex-1">
        <SearchBar />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell />
        <UserProfileDropdown />
      </div>
    </header>
  );
}
