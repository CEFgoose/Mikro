import { Card, CardContent } from "@/components/ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { COLORS } from "@/lib/chartColors";

export function MiniActivityChart({
  title,
  data,
}: {
  title: string;
  data: { day: string; deleted: number; added: number; modified: number }[];
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs font-semibold text-foreground mb-2">
          Team Activity: {title}
        </p>
        <div style={{ width: "100%", height: 140 }}>
          <ResponsiveContainer>
            <BarChart data={data} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} width={35} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 9 }} iconSize={8} />
              <Bar dataKey="deleted" name="Deleted" fill={COLORS.deleted} stackId="a" />
              <Bar dataKey="added" name="Added" fill={COLORS.added} stackId="a" />
              <Bar dataKey="modified" name="Modified" fill={COLORS.modified} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
