import { useState } from "react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { TICKET_CATEGORIES, TICKET_STATUS, TICKET_PRIORITY, STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";

export default function TicketFilters({ filters, onFilterChange }) {
  const [showFilters, setShowFilters] = useState(false);

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      search: "",
      status: "",
      priority: "",
      category: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={filters.search || ""}
            onChange={(e) => handleChange("search", e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 p-4 rounded-lg border bg-muted/30">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select
              value={filters.status || ""}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value="">All Statuses</option>
              {Object.entries(TICKET_STATUS).map(([key, value]) => (
                <option key={key} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Priority</label>
            <Select
              value={filters.priority || ""}
              onChange={(e) => handleChange("priority", e.target.value)}
            >
              <option value="">All Priorities</option>
              {Object.entries(TICKET_PRIORITY).map(([key, value]) => (
                <option key={key} value={value}>
                  {PRIORITY_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <Select
              value={filters.category || ""}
              onChange={(e) => handleChange("category", e.target.value)}
            >
              <option value="">All Categories</option>
              {TICKET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date From</label>
            <Input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => handleChange("dateFrom", e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
