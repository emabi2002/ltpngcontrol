"use client";

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AreaChartProps {
  data: { date: string; value: number; label?: string }[];
  title?: string;
  subtitle?: string;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  height?: number;
  className?: string;
  showGrid?: boolean;
  valueFormatter?: (value: number) => string;
  xAxisKey?: string;
  yAxisKey?: string;
}

// Simple wrapper for use in dashboards
export function AreaChart({
  data,
  color = "#f59e0b",
  height = 180,
}: {
  data: { date: string; value: number }[];
  color?: string;
  height?: number;
}) {
  const formatXAxis = (value: string) => {
    if (value.includes("-")) {
      const parts = value.split("-");
      if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}`;
      }
      return parts[1] || value;
    }
    return value;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="simpleGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#52525b"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatXAxis}
        />
        <YAxis
          stroke="#52525b"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value.toLocaleString()}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "#a1a1aa" }}
          itemStyle={{ color }}
          formatter={(value) => [Number(value).toLocaleString(), "Value"]}
          labelFormatter={(label) => formatXAxis(label as string)}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="url(#simpleGradient)"
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}

export function AreaChartComponent({
  data,
  title,
  subtitle,
  color = "#10b981",
  gradientFrom = "#10b981",
  gradientTo = "transparent",
  height = 200,
  className,
  showGrid = true,
  valueFormatter = (value) => value.toLocaleString(),
  xAxisKey = "date",
  yAxisKey = "value",
}: AreaChartProps) {
  const formatXAxis = (value: string) => {
    if (value.includes("-")) {
      const parts = value.split("-");
      if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}`;
      }
      return parts[1] || value;
    }
    return value;
  };

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
          <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${title?.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientFrom} stopOpacity={0.3} />
                <stop offset="95%" stopColor={gradientTo} stopOpacity={0} />
              </linearGradient>
            </defs>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            )}
            <XAxis
              dataKey={xAxisKey}
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatXAxis}
            />
            <YAxis
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => valueFormatter(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#a1a1aa" }}
              itemStyle={{ color: color }}
              formatter={(value) => [valueFormatter(value as number), "Value"]}
              labelFormatter={(label) => formatXAxis(label as string)}
            />
            <Area
              type="monotone"
              dataKey={yAxisKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${title?.replace(/\s/g, "")})`}
            />
          </RechartsAreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
