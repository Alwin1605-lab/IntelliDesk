import FaqCards from "@/components/support/FaqCards";

export default function KnowledgeBasePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="text-muted-foreground">
          Browse articles and guides to resolve common issues.
        </p>
      </div>
      <FaqCards />
    </div>
  );
}
