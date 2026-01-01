"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Scale,
  Search,
  Building2,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  CheckSquare,
  FileText,
  Calendar,
  Map,
  AlertTriangle,
  Activity,
  Database,
  Users,
  TrendingUp,
  Shield,
  BarChart3,
  Zap,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  children?: { id: string; label: string; icon: React.ReactNode }[];
}

interface SidebarProps {
  activeLayer: string;
  activeSection?: string;
  onNavigate: (layer: string, section?: string) => void;
  alertCount?: number;
}

const navItems: NavItem[] = [
  {
    id: "executive",
    label: "Executive Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    children: [
      { id: "overview", label: "Overview", icon: <TrendingUp className="h-4 w-4" /> },
      { id: "legal", label: "Legal Metrics", icon: <Scale className="h-4 w-4" /> },
      { id: "audit", label: "Audit Metrics", icon: <Search className="h-4 w-4" /> },
      { id: "corporate", label: "Corporate Metrics", icon: <Building2 className="h-4 w-4" /> },
      { id: "health", label: "System Health", icon: <Activity className="h-4 w-4" /> },
    ],
  },
  {
    id: "legal",
    label: "Legal Case Management",
    icon: <Scale className="h-5 w-5" />,
    children: [
      { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: "cases", label: "Cases", icon: <Briefcase className="h-4 w-4" /> },
      { id: "tasks", label: "Tasks", icon: <CheckSquare className="h-4 w-4" /> },
      { id: "documents", label: "Documents", icon: <FileText className="h-4 w-4" /> },
      { id: "events", label: "Calendar", icon: <Calendar className="h-4 w-4" /> },
      { id: "parcels", label: "Land Parcels", icon: <Map className="h-4 w-4" /> },
    ],
  },
  {
    id: "audit",
    label: "Audit System",
    icon: <Search className="h-5 w-5" />,
    children: [
      { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: "findings", label: "Findings", icon: <AlertTriangle className="h-4 w-4" /> },
      { id: "reports", label: "Reports", icon: <FileText className="h-4 w-4" /> },
    ],
  },
  {
    id: "corporate",
    label: "Corporate Matters",
    icon: <Building2 className="h-5 w-5" />,
    children: [
      { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: "matters", label: "Matters", icon: <Briefcase className="h-4 w-4" /> },
      { id: "documents", label: "Documents", icon: <FileText className="h-4 w-4" /> },
    ],
  },
  {
    id: "database",
    label: "Database Monitor",
    icon: <Database className="h-5 w-5" />,
    children: [
      { id: "tables", label: "Tables", icon: <Database className="h-4 w-4" /> },
      { id: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
      { id: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
    ],
  },
  {
    id: "analytics",
    label: "Cloud Infrastructure",
    icon: <BarChart3 className="h-5 w-5" />,
    children: [
      { id: "overview", label: "Usage & Storage", icon: <Database className="h-4 w-4" /> },
      { id: "live", label: "Billing & Costs", icon: <Zap className="h-4 w-4" /> },
      { id: "reports", label: "Growth Projections", icon: <TrendingUp className="h-4 w-4" /> },
    ],
  },
  {
    id: "monitoring",
    label: "Monitoring & Alerts",
    icon: <Activity className="h-5 w-5" />,
    children: [
      { id: "alerts", label: "Alert Thresholds", icon: <AlertTriangle className="h-4 w-4" /> },
      { id: "reports", label: "Email Reports", icon: <FileText className="h-4 w-4" /> },
      { id: "history", label: "Historical Data", icon: <TrendingUp className="h-4 w-4" /> },
      { id: "realtime", label: "Real-time Updates", icon: <Zap className="h-4 w-4" /> },
    ],
  },
  {
    id: "admin",
    label: "Systems Administration",
    icon: <Settings className="h-5 w-5" />,
    children: [
      { id: "housekeeping", label: "Housekeeping", icon: <Database className="h-4 w-4" /> },
      { id: "email", label: "Email Config", icon: <Mail className="h-4 w-4" /> },
      { id: "users", label: "User Management", icon: <Users className="h-4 w-4" /> },
      { id: "backups", label: "Backups", icon: <Database className="h-4 w-4" /> },
      { id: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
      { id: "settings", label: "System Settings", icon: <Settings className="h-4 w-4" /> },
      { id: "logs", label: "Audit Logs", icon: <FileText className="h-4 w-4" /> },
      { id: "tasks", label: "Scheduled Tasks", icon: <Calendar className="h-4 w-4" /> },
    ],
  },
];

export function Sidebar({
  activeLayer,
  activeSection,
  onNavigate,
  alertCount = 0,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([activeLayer]);

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex flex-col h-full bg-zinc-950 border-r border-zinc-800/50 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Database className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-zinc-100">Lands DB</h1>
                <p className="text-[10px] text-zinc-500">Monitoring System</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = activeLayer === item.id;
              const isExpanded = expandedItems.includes(item.id);

              return (
                <div key={item.id}>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-center h-10",
                            isActive
                              ? "bg-zinc-800 text-zinc-100"
                              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                          )}
                          onClick={() => {
                            onNavigate(item.id);
                            if (item.children?.[0]) {
                              onNavigate(item.id, item.children[0].id);
                            }
                          }}
                        >
                          {item.icon}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-10",
                          isActive
                            ? "bg-zinc-800 text-zinc-100"
                            : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                        )}
                        onClick={() => {
                          toggleExpanded(item.id);
                          onNavigate(item.id);
                        }}
                      >
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant="outline"
                            className="ml-auto text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                      {item.children && isExpanded && (
                        <div className="ml-4 mt-1 space-y-1 border-l border-zinc-800 pl-3">
                          {item.children.map((child) => (
                            <Button
                              key={child.id}
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "w-full justify-start gap-2 h-8 text-xs",
                                activeSection === child.id && activeLayer === item.id
                                  ? "bg-zinc-800/70 text-zinc-100"
                                  : "text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/30"
                              )}
                              onClick={() => onNavigate(item.id, child.id)}
                            >
                              {child.icon}
                              {child.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800/50 p-2">
          {isCollapsed ? (
            <div className="space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-center h-10 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 relative"
                  >
                    <Bell className="h-5 w-5" />
                    {alertCount > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Alerts ({alertCount})</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-center h-10 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-10 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
              >
                <Bell className="h-5 w-5" />
                <span className="text-sm">Alerts</span>
                {alertCount > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-auto text-[10px] bg-red-500/10 text-red-400 border-red-500/20"
                  >
                    {alertCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-10 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
              >
                <Settings className="h-5 w-5" />
                <span className="text-sm">Settings</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
