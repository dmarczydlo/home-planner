import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-8 right-8 z-50
        w-16 h-16 rounded-2xl
        bg-gradient-to-br from-accent to-accent/80
        hover:from-accent hover:to-accent/90
        text-accent-foreground shadow-2xl hover:shadow-accent/50
        transition-all duration-200
        flex items-center justify-center
        focus:outline-none focus:ring-4 focus:ring-accent/30
        active:scale-95
        hover:scale-110
        group
      "
      aria-label="Create new event"
    >
      <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
    </button>
  );
}
