import type { ReactNode } from "react";

export function LegalLinks(): ReactNode {
  return (
    <div className="flex flex-col items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex gap-4">
        <a
          href="/privacy"
          className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          Privacy Policy
        </a>
        <span aria-hidden="true">•</span>
        <a
          href="/terms"
          className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          Terms of Service
        </a>
      </div>
    </div>
  );
}
