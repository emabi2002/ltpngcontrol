"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Bell,
  X,
} from "lucide-react";
import type { Alert } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface AlertPanelProps {
  alerts: Alert[];
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
  className?: string;
  maxHeight?: number;
  showHeader?: boolean;
}

export function AlertPanel({
  alerts,
  onAcknowledge,
  onDismiss,
  className,
  maxHeight = 400,
  showHeader = true,
}: AlertPanelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getAlertIcon = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case "info":
        return <Info className="h-4 w-4 text-sky-400" />;
      default:
        return <Bell className="h-4 w-4 text-zinc-400" />;
    }
  };

  const getAlertStyles = (severity: Alert["severity"], acknowledged: boolean) => {
    if (acknowledged) {
      return "border-zinc-700/50 bg-zinc-800/30";
    }
    switch (severity) {
      case "critical":
      case "error":
        return "border-red-500/30 bg-red-500/5";
      case "warning":
        return "border-amber-500/30 bg-amber-500/5";
      case "info":
        return "border-sky-500/30 bg-sky-500/5";
      default:
        return "border-zinc-700/50 bg-zinc-800/50";
    }
  };

  const getSeverityBadge = (severity: Alert["severity"]) => {
    const styles: Record<string, string> = {
      critical: "bg-red-500/10 text-red-400 border-red-500/20",
      error: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    };
    return (
      <Badge variant="outline" className={cn("text-[10px] uppercase", styles[severity] || styles.info)}>
        {severity}
      </Badge>
    );
  };

  const getSourceBadge = (source: Alert["source"]) => {
    const styles: Record<string, string> = {
      legal: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      audit: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      corporate: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      system: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    };
    return (
      <Badge variant="outline" className={cn("text-[10px] uppercase", styles[source] || styles.system)}>
        {source}
      </Badge>
    );
  };

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;
  const criticalCount = alerts.filter((a) => a.severity === "critical" && !a.acknowledged).length;

  return (
    <Card className={cn("border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm", className)}>
      {showHeader && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-100 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alerts
              {unacknowledgedCount > 0 && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    criticalCount > 0
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  )}
                >
                  {unacknowledgedCount}
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
      )}
      <CardContent className="pb-4">
        <ScrollArea style={{ maxHeight: `${maxHeight}px` }}>
          <div className="space-y-2 pr-2">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                <CheckCircle2 className="h-8 w-8 mb-2" />
                <p className="text-sm">No active alerts</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "relative rounded-lg border p-3 transition-all duration-200",
                    getAlertStyles(alert.severity, alert.acknowledged)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getAlertIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {getSeverityBadge(alert.severity)}
                        {getSourceBadge(alert.source)}
                        <span className="text-[10px] text-zinc-500">
                          {mounted ? formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true }) : ""}
                        </span>
                      </div>
                      <h4
                        className={cn(
                          "text-sm font-medium mb-0.5",
                          alert.acknowledged ? "text-zinc-400" : "text-zinc-100"
                        )}
                      >
                        {alert.title}
                      </h4>
                      <p className="text-xs text-zinc-500 line-clamp-2">
                        {alert.message}
                      </p>
                      {!alert.acknowledged && onAcknowledge && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 h-7 text-xs text-zinc-400 hover:text-zinc-100"
                          onClick={() => onAcknowledge(alert.id)}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                    </div>
                    {onDismiss && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-100"
                        onClick={() => onDismiss(alert.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
