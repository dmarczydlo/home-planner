import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ChildDTO } from "@/types";

interface ChildCardProps {
  child: ChildDTO;
  onRemove?: (childId: string) => void;
  canRemove?: boolean;
}

export function ChildCard({ child, onRemove, canRemove = true }: ChildCardProps) {
  const handleRemove = () => {
    if (onRemove && canRemove) {
      onRemove(child.id);
    }
  };

  return (
    <Card className="min-h-[80px]">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-base">{child.name}</h3>
          <p className="text-xs text-muted-foreground">Added to your family</p>
        </div>
        {canRemove && onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="min-h-[44px] min-w-[44px]"
            aria-label={`Remove ${child.name}`}
          >
            Remove
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
