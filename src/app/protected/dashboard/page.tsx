export default function DashboardPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your authenticated workspace. Switch organization from the sidebar.
        </p>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      <div className="min-h-[40vh] flex-1 rounded-xl bg-muted/50" />
    </div>
  );
}
