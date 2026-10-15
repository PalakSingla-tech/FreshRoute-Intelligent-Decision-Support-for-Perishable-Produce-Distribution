export function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 h-full items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
