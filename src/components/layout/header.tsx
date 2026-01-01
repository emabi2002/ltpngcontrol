"use client";

import { cn } from "@/lib/utils";
import {
  CalendarDays,
  RefreshCw,
  Download,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
  lastUpdated?: Date;
  className?: string;
}

const dateRanges = [
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "This month", value: "month" },
  { label: "This quarter", value: "quarter" },
  { label: "This year", value: "year" },
  { label: "Custom range", value: "custom" },
];

export function Header({
  title,
  subtitle,
  onRefresh,
  onExport,
  isLoading = false,
  lastUpdated,
  className,
}: HeaderProps) {
  const [dateRange, setDateRange] = useState("30d");
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedRange = dateRanges.find((r) => r.value === dateRange);

  return (
    <header
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">{title}</h1>
        {subtitle && (
          <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>
        )}
        {lastUpdated && mounted && (
          <p className="text-xs text-zinc-600 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Date Range Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-9 gap-2 border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">{selectedRange?.label}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-zinc-900 border-zinc-800"
          >
            {dateRanges.map((range) => (
              <DropdownMenuItem
                key={range.value}
                onClick={() => setDateRange(range.value)}
                className={cn(
                  "text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100",
                  dateRange === range.value && "bg-zinc-800"
                )}
              >
                {range.label}
                {dateRange === range.value && (
                  <Badge
                    variant="outline"
                    className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  >
                    Active
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Refresh Button */}
        {onRefresh && (
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("h-4 w-4", isLoading && "animate-spin")}
            />
          </Button>
        )}

        {/* Export Button */}
        {onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 gap-2 border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 bg-zinc-900 border-zinc-800"
            >
              <DropdownMenuItem
                onClick={onExport}
                className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
              >
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onExport}
                className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
              >
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                onClick={onExport}
                className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
              >
                Schedule Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          onClick={() => setIsDark(!isDark)}
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
