"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BarChartProps {
  data: Record<string, unknown>[];
  title?: string;
  subtitle?: string;
  color?: string;
  colors?: string[];
  height?: number;
  className?: string;
  showGrid?: boolean;
  valueFormatter?: (value: number) => string;
  xAxisKey?: string;
  yAxisKey?: string;
  layout?: "horizontal" | "vertical";
}

export function BarChartComponent({
  data,
  title,
  subtitle,
  color = "#10b981",
  colors,
  height = 200,
  className,
  showGrid = true,
  valueFormatter = (value) => value.toLocaleString(),
  xAxisKey = "name",
  yAxisKey = "value",
  layout = "horizontal",
}: BarChartProps) {
  const chartColors = colors || [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
  ];

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
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart
            data={data}
            layout={layout === "vertical" ? "vertical" : "horizontal"}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={layout !== "vertical"} horizontal={layout === "vertical"} />
            )}
            {layout === "vertical" ? (
              <>
                <XAxis
                  type="number"
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => valueFormatter(value)}
                />
                <YAxis
                  type="category"
                  dataKey={xAxisKey}
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey={xAxisKey}
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => valueFormatter(value)}
                />
              </>
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#a1a1aa" }}
              formatter={(value) => [valueFormatter(value as number), "Value"]}
              cursor={{ fill: "#27272a" }}
            />
            <Bar dataKey={yAxisKey} radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${
                    // biome-ignore lint/suspicious/noArrayIndexKey: chart cells need index
                    index
                  }`}
                  fill={colors ? chartColors[index % chartColors.length] : color}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
