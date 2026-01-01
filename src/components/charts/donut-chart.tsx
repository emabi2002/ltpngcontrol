"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DonutChartProps {
  data: { name: string; value: number; color?: string }[];
  title?: string;
  subtitle?: string;
  centerValue?: string | number;
  centerLabel?: string;
  height?: number;
  className?: string;
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

// Simple wrapper for use in dashboards
export function DonutChart({
  data,
  height = 180,
}: {
  data: { name: string; value: number; color?: string }[];
  height?: number;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value) => [Number(value).toLocaleString(), ""]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
              />
              <span className="text-zinc-400 truncate">{entry.name}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-zinc-100 font-medium">
                {entry.value.toLocaleString()}
              </span>
              <span className="text-zinc-500">
                ({total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DonutChartComponent({
  data,
  title,
  subtitle,
  centerValue,
  centerLabel,
  height = 200,
  className,
  showLegend = true,
  valueFormatter = (value) => value.toLocaleString(),
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card
      className={cn(
        "border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm",
        className
      )}
    >
      {(title || subtitle) && (
        <CardHeader className="pb-2">
          {title && (
            <CardTitle className="text-sm font-medium text-zinc-100">
              {title}
            </CardTitle>
          )}
          {subtitle && (
            <p className="text-xs text-zinc-500">{subtitle}</p>
          )}
        </CardHeader>
      )}
      <CardContent className="pb-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0" style={{ width: height, height }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="85%"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${
                        // biome-ignore lint/suspicious/noArrayIndexKey: chart cells need index
                        index
                      }`}
                      fill={entry.color || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [valueFormatter(value as number), ""]}
                />
              </PieChart>
            </ResponsiveContainer>
            {(centerValue !== undefined || centerLabel) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {centerValue !== undefined && (
                  <span className="text-xl font-bold text-zinc-100">
                    {centerValue}
                  </span>
                )}
                {centerLabel && (
                  <span className="text-xs text-zinc-500">{centerLabel}</span>
                )}
              </div>
            )}
          </div>
          {showLegend && (
            <div className="flex-1 space-y-2">
              {data.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
                    />
                    <span className="text-zinc-400 truncate">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-zinc-100 font-medium">
                      {valueFormatter(entry.value)}
                    </span>
                    <span className="text-zinc-500">
                      ({((entry.value / total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
