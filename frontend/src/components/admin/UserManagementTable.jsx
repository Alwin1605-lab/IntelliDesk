import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, UserPlus, Edit, Trash2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const defaultUsers = [
  { id: 1, name: "John Doe", email: "john@company.com", role: "user", department: "Engineering", status: "active" },
  { id: 2, name: "Alex Johnson", email: "alex@company.com", role: "technician", department: "IT Support", status: "active" },
  { id: 3, name: "Sarah Chen", email: "sarah@company.com", role: "technician", department: "IT Support", status: "active" },
  { id: 4, name: "Emily Garcia", email: "emily@company.com", role: "manager", department: "IT Management", status: "active" },
  { id: 5, name: "Mike Rivera", email: "mike@company.com", role: "technician", department: "IT Support", status: "inactive" },
  { id: 6, name: "Priya Patel", email: "priya@company.com", role: "admin", department: "IT Management", status: "active" },
];

const roleColors = {
  user: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  technician: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  manager: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function UserManagementTable({ users }) {
  const [search, setSearch] = useState("");
  const data = users || defaultUsers;

  const filtered = data.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">User Management</CardTitle>
        <Button size="sm" className="gap-1">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback name={user.name} className="text-xs" />
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize", roleColors[user.role])}>
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{user.department}</TableCell>
                <TableCell>
                  <Badge variant={user.status === "active" ? "success" : "secondary"}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="cursor-pointer" onClick={() => toast.info(`Edit ${user.name}`)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={() => toast.info(`Change role for ${user.name}`)}>
                        <Shield className="mr-2 h-4 w-4" /> Change Role
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer text-destructive" onClick={() => toast.info(`Delete ${user.name}`)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
