import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        bg-blue-600 hover:bg-blue-700
        dark:bg-blue-500 dark:hover:bg-blue-600
        text-white shadow-lg hover:shadow-xl
        transition-all duration-200
        flex items-center justify-center
        focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800
        active:scale-95
      "
      aria-label="Create new event"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}
