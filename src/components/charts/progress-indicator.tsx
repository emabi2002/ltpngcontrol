"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface ProgressIndicatorProps {
  title: string;
  used: number;
  limit: number;
  unit?: string;
  showPercentage?: boolean;
  warningThreshold?: number;
  dangerThreshold?: number;
  className?: string;
  valueFormatter?: (value: number) => string;
}

export function ProgressIndicator({
  title,
  used,
  limit,
  unit = "",
  showPercentage = true,
  warningThreshold = 75,
  dangerThreshold = 90,
  className,
  valueFormatter = (value) => value.toLocaleString(),
}: ProgressIndicatorProps) {
  const percentage = (used / limit) * 100;
  const isWarning = percentage >= warningThreshold && percentage < dangerThreshold;
  const isDanger = percentage >= dangerThreshold;

  const getProgressColor = () => {
    if (isDanger) return "bg-red-500";
    if (isWarning) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <Card
      className={cn(
        "border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-100">
            {title}
          </CardTitle>
          {(isWarning || isDanger) && (
            <AlertTriangle
              className={cn(
                "h-4 w-4",
                isDanger ? "text-red-500" : "text-amber-500"
              )}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", getProgressColor())}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">
              {valueFormatter(used)} {unit}
            </span>
            <span className="text-zinc-500">
              {showPercentage && (
                <span className={cn(
                  isDanger ? "text-red-400" : isWarning ? "text-amber-400" : "text-zinc-400"
                )}>
                  {percentage.toFixed(1)}% used
                </span>
              )}
              {" / "}
              {valueFormatter(limit)} {unit}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MultiProgressProps {
  title: string;
  items: {
    label: string;
    used: number;
    limit: number;
    color?: string;
  }[];
  className?: string;
  valueFormatter?: (value: number) => string;
}

export function MultiProgressIndicator({
  title,
  items,
  className,
  valueFormatter = (value) => value.toLocaleString(),
}: MultiProgressProps) {
  const colors = [
    "bg-emerald-500",
    "bg-sky-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-violet-500",
  ];

  return (
    <Card
      className={cn(
        "border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm",
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-100">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => {
            const percentage = (item.used / item.limit) * 100;
            return (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">{item.label}</span>
                  <span className="text-zinc-500">
                    {valueFormatter(item.used)} / {valueFormatter(item.limit)}
                  </span>
                </div>
                <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      item.color || colors[index % colors.length]
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
