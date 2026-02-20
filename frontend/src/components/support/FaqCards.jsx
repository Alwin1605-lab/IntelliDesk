import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, ChevronRight } from "lucide-react";

const defaultFaqs = [
  {
    id: 1,
    title: "How to reset your password",
    description: "Step-by-step guide to reset your corporate password through the self-service portal.",
    category: "Access/Permissions",
    views: 1250,
  },
  {
    id: 2,
    title: "VPN setup for remote work",
    description: "Configure VPN on Windows, Mac, and mobile devices for secure remote access.",
    category: "VPN",
    views: 980,
  },
  {
    id: 3,
    title: "Printer troubleshooting guide",
    description: "Common printer issues and their solutions: paper jam, offline status, print quality.",
    category: "Printer",
    views: 756,
  },
  {
    id: 4,
    title: "Email setup on mobile devices",
    description: "Configure your corporate email on iOS and Android devices using Exchange ActiveSync.",
    category: "Email",
    views: 654,
  },
  {
    id: 5,
    title: "Software installation requests",
    description: "How to request new software installations through the IT portal.",
    category: "Software",
    views: 543,
  },
  {
    id: 6,
    title: "Network drive mapping",
    description: "Map shared network drives on Windows and Mac for file access.",
    category: "Network",
    views: 432,
  },
];

export default function FaqCards({ faqs }) {
  const [search, setSearch] = useState("");
  const data = faqs || defaultFaqs;

  const filtered = data.filter(
    (faq) =>
      faq.title.toLowerCase().includes(search.toLowerCase()) ||
      faq.description.toLowerCase().includes(search.toLowerCase()) ||
      faq.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search knowledge base..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((faq) => (
          <Card
            key={faq.id}
            className="hover:shadow-md transition-shadow cursor-pointer group"
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {faq.category}
                </Badge>
              </div>
              <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                {faq.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {faq.description}
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground">
                  {faq.views.toLocaleString()} views
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">
            No articles found for "{search}"
          </p>
        </div>
      )}
    </div>
  );
}
