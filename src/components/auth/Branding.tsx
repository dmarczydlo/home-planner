import type { ReactNode } from "react";

export function Branding(): ReactNode {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex items-center justify-center">
        <div className="size-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
          <span className="text-2xl font-bold text-white">HP</span>
        </div>
      </div>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Home Planner</h1>
        <p className="text-base text-gray-600 dark:text-gray-400">Organize your family</p>
      </div>
    </div>
  );
}



