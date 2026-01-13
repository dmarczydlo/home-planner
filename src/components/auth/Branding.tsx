import type { ReactNode } from "react";

export function Branding(): ReactNode {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex items-center justify-center">
        <div className="size-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl ring-4 ring-primary/10">
          <span className="text-3xl font-bold text-primary-foreground">HP</span>
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Home Planner</h1>
        <p className="text-base text-muted-foreground">Your family, perfectly coordinated</p>
      </div>
    </div>
  );
}
