import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagementTable from "@/components/admin/UserManagementTable";
import TechnicianSkillSettings from "@/components/admin/TechnicianSkillSettings";
import AssignmentRulesPanel from "@/components/admin/AssignmentRulesPanel";
import ReportsDownloadButton from "@/components/admin/ReportsDownloadButton";

export default function AdminPanelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage users, technicians, assignment rules, and reports.
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagementTable />
        </TabsContent>

        <TabsContent value="skills">
          <TechnicianSkillSettings />
        </TabsContent>

        <TabsContent value="rules">
          <AssignmentRulesPanel />
        </TabsContent>

        <TabsContent value="reports">
          <div className="max-w-md">
            <ReportsDownloadButton />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
