import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChildCard } from "./ChildCard";
import { Plus } from "lucide-react";
import type { ChildDTO } from "@/types";

interface ChildrenListProps {
  children: ChildDTO[];
  onAddClick?: () => void;
  onEdit?: (child: ChildDTO) => void;
  onRemove?: (childId: string) => Promise<void>;
}

export function ChildrenList({ children, onAddClick, onEdit, onRemove }: ChildrenListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl">Children ({children.length})</CardTitle>
        {onAddClick && (
          <Button onClick={onAddClick} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Child</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {children.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No children added yet</p>
            {onAddClick && (
              <Button onClick={onAddClick} variant="outline" size="sm" className="mt-4">
                Add your first child
              </Button>
            )}
          </div>
        ) : (
          <div role="list" aria-label="Children" className="space-y-3">
            {children.map((child) => (
              <div key={child.id} role="listitem">
                <ChildCard child={child} onEdit={onEdit} onRemove={onRemove} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
