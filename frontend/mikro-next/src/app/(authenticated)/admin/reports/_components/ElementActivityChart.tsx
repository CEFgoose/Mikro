"use client";

import { useMemo } from "react";
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
import type { ElementAnalysisCategory } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  "Oneways": "#1d4ed8",
  "Access & Barriers": "#7c3aed",
  "Highways": "#0f766e",
  "Refs": "#f59e0b",
  "Turn Restrictions": "#dc2626",
  "Names": "#db2777",
  "Construction": "#38bdf8",
  "Classifications": "#16a34a",
};

interface ElementActivityChartProps {
  categories: ElementAnalysisCategory[];
}

export function ElementActivityChart({ categories }: ElementActivityChartProps) {
  const { chartData, activeCategories } = useMemo(() => {
    const dayMap: Record<string, Record<string, number | string>> = {};
    for (const cat of categories) {
      for (const d of cat.data) {
        if (!dayMap[d.day]) dayMap[d.day] = { day: d.day };
        dayMap[d.day][cat.title] = d.added + d.modified + d.deleted;
      }
    }
    return {
      chartData: Object.values(dayMap).sort((a, b) => (a.day as string).localeCompare(b.day as string)),
      activeCategories: categories.filter((c) => c.data.length > 0),
    };
  }, [categories]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No data for the selected range
      </div>
    );
  }

  return (
    <div data-chart-export="Element Analysis" style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} barSize={24}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} width={45} />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => Number(value).toLocaleString()}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
          {activeCategories.map((cat) => (
            <Bar
              key={cat.title}
              dataKey={cat.title}
              stackId="a"
              fill={CATEGORY_COLORS[cat.title] ?? "#94a3b8"}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
