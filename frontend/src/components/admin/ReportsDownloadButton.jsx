import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Download, Loader2, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardAPI } from "@/api/dashboard";
import { toast } from "sonner";

export default function ReportsDownloadButton() {
  const [reportType, setReportType] = useState("weekly");
  const [format, setFormat] = useState("csv");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await dashboardAPI.downloadReport({ type: reportType, format });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report_${reportType}_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Report downloaded successfully!");
    } catch {
      toast.error("Failed to download report. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Download Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Report Type</label>
            <Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="daily">Daily Summary</option>
              <option value="weekly">Weekly Summary</option>
              <option value="monthly">Monthly Summary</option>
              <option value="sla">SLA Compliance</option>
              <option value="technician">Technician Performance</option>
              <option value="category">Category Analysis</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Format</label>
            <Select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel (XLSX)</option>
              <option value="pdf">PDF</option>
            </Select>
          </div>
        </div>
        <Button onClick={handleDownload} disabled={isDownloading} className="w-full gap-2">
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isDownloading ? "Generating..." : "Download Report"}
        </Button>
      </CardContent>
    </Card>
  );
}
