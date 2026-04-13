import { Card, CardContent } from "./Card";
import { Val } from "./Val";
import type { FormattedValue } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: FormattedValue | string | number;
  sub?: string;
}

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">
          {typeof value === "object" && "isPlaceholder" in value ? (
            <Val>{value}</Val>
          ) : (
            value
          )}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}
