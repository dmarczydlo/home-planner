import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { ChildDTO } from "@/types";

interface ChildCardProps {
  child: ChildDTO;
  onEdit?: (child: ChildDTO) => void;
  onRemove?: (childId: string) => Promise<void>;
  canEdit?: boolean;
}

export function ChildCard({ child, onEdit, onRemove, canEdit = true }: ChildCardProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const createdDate = format(new Date(child.created_at), "MMM d, yyyy");

  const handleRemove = async () => {
    if (!onRemove) return;

    setIsProcessing(true);
    try {
      await onRemove(child.id);
      setShowRemoveDialog(false);
    } catch (error) {
      console.error("Failed to remove child:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(child);
    }
  };

  return (
    <>
      <Card className="min-h-[80px]">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{child.name}</h3>
            <p className="text-xs text-muted-foreground">Added {createdDate}</p>
          </div>
          {canEdit && (onEdit || onRemove) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  aria-label={`Actions for ${child.name}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit name
                  </DropdownMenuItem>
                )}
                {onRemove && (
                  <DropdownMenuItem onClick={() => setShowRemoveDialog(true)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove child</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {child.name}? This will also remove them from all events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={isProcessing} className="bg-destructive">
              {isProcessing ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
