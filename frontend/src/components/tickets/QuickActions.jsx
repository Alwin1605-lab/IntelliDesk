import { MoreHorizontal, UserPlus, CheckCircle, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function QuickActions({ ticket, onAssign, onClose, onEscalate }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAssign(ticket)} className="cursor-pointer">
          <UserPlus className="mr-2 h-4 w-4" />
          Assign
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onClose(ticket)} className="cursor-pointer">
          <CheckCircle className="mr-2 h-4 w-4" />
          Close
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onEscalate(ticket)}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Escalate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
