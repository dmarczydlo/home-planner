import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import type { FamilyDetailsDTO } from "@/types";

interface FamilyHeaderProps {
  family: FamilyDetailsDTO;
}

export function FamilyHeader({ family }: FamilyHeaderProps) {
  const createdDate = format(new Date(family.created_at), "MMMM yyyy");

  return (
    <Card>
      <CardContent className="p-6">
        <h1 className="text-2xl font-bold mb-1">{family.name}</h1>
        <p className="text-sm text-muted-foreground">Created: {createdDate}</p>
      </CardContent>
    </Card>
  );
}
