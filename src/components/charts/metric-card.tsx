"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
  AlertCircle,
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "stable";
  status?: "success" | "warning" | "danger" | "info";
  icon?: React.ReactNode;
  className?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  trend,
  status,
  icon,
  className,
  subtitle,
  size = "md",
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="h-4 w-4" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-emerald-500";
    if (trend === "down") return "text-red-500";
    return "text-zinc-400";
  };

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "danger":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "info":
        return <Info className="h-5 w-5 text-sky-500" />;
      default:
        return null;
    }
  };

  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const valueClasses = {
    sm: "text-xl font-bold",
    md: "text-2xl font-bold",
    lg: "text-3xl font-bold",
  };

  return (
    <Card
      className={cn(
        "border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm hover:bg-zinc-900/70 transition-all duration-200",
        className
      )}
    >
      <CardContent className={sizeClasses[size]}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider truncate">
              {title}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className={cn(valueClasses[size], "text-zinc-100")}>{value}</p>
              {change !== undefined && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-sm font-medium",
                    getTrendColor()
                  )}
                >
                  {getTrendIcon()}
                  {Math.abs(change)}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
            )}
            {changeLabel && (
              <p className="mt-1 text-xs text-zinc-500">{changeLabel}</p>
            )}
          </div>
          <div className="flex-shrink-0 ml-3">
            {icon || getStatusIcon()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function MetricGrid({
  children,
  columns = 4,
  className,
}: MetricGridProps) {
  const colClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  };

  return (
    <div className={cn("grid gap-4", colClasses[columns], className)}>
      {children}
    </div>
  );
}
