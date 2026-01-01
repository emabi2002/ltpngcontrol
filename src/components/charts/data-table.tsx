"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Column<T> {
  key: keyof T;
  label: string;
  align?: "left" | "center" | "right";
  format?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  subtitle?: string;
  className?: string;
  maxHeight?: number;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  title,
  subtitle,
  className,
  maxHeight,
  onRowClick,
}: DataTableProps<T>) {
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
        <div
          className={cn("overflow-auto", maxHeight && `max-h-[${maxHeight}px]`)}
          style={maxHeight ? { maxHeight: `${maxHeight}px` } : undefined}
        >
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                {columns.map((col) => (
                  <TableHead
                    key={String(col.key)}
                    className={cn(
                      "text-xs font-medium text-zinc-400 uppercase tracking-wider",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center"
                    )}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow
                  key={JSON.stringify(row).slice(0, 50) + index}
                  className={cn(
                    "border-zinc-800/50",
                    onRowClick && "cursor-pointer hover:bg-zinc-800/50"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={String(col.key)}
                      className={cn(
                        "text-sm text-zinc-300",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center"
                      )}
                    >
                      {col.format
                        ? col.format(row[col.key], row)
                        : String(row[col.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper formatters
export function formatCurrency(value: number): React.ReactNode {
  return (
    <span className="font-mono">
      ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

export function formatNumber(value: number): React.ReactNode {
  return <span className="font-mono">{value.toLocaleString()}</span>;
}

export function formatPercentage(value: number): React.ReactNode {
  return <span className="font-mono">{value.toFixed(1)}%</span>;
}

export function formatTrend(value: number): React.ReactNode {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-400">
        <TrendingUp className="h-3 w-3" />
        +{value.toFixed(1)}%
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-red-400">
        <TrendingDown className="h-3 w-3" />
        {value.toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-zinc-400">
      <Minus className="h-3 w-3" />
      0%
    </span>
  );
}

export function formatStatus(status: string): React.ReactNode {
  const statusStyles: Record<string, string> = {
    healthy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <Badge
      variant="outline"
      className={cn("capitalize text-xs", statusStyles[status.toLowerCase()] || statusStyles.info)}
    >
      {status}
    </Badge>
  );
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
