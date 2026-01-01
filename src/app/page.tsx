"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { ExecutiveDashboard } from "@/components/dashboards/executive-dashboard";
import { LegalDashboard } from "@/components/dashboards/legal-dashboard";
import { AuditDashboard } from "@/components/dashboards/audit-dashboard";
import { CorporateDashboard } from "@/components/dashboards/corporate-dashboard";
import { DatabaseMonitor } from "@/components/dashboards/database-monitor";
import { CloudInfrastructureDashboard } from "@/components/analytics/cloud-infrastructure-dashboard";
import { MonitoringSettingsDashboard } from "@/components/analytics/monitoring-settings-dashboard";
import { SystemsAdminDashboard } from "@/components/admin/systems-admin-dashboard";
import { generateAlerts } from "@/lib/lands-data-service";
import type { Alert } from "@/lib/types";

export default function Home() {
  const [activeLayer, setActiveLayer] = useState("executive");
  const [activeSection, setActiveSection] = useState("overview");
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Fetch alerts on mount
    const fetchAlerts = async () => {
      try {
        const generatedAlerts = await generateAlerts();
        setAlerts(generatedAlerts);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };
    fetchAlerts();

    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (layer: string, section?: string) => {
    setActiveLayer(layer);
    if (section) {
      setActiveSection(section);
    } else {
      // Set default section for each layer
      switch (layer) {
        case "executive":
          setActiveSection("overview");
          break;
        case "legal":
          setActiveSection("overview");
          break;
        case "audit":
          setActiveSection("overview");
          break;
        case "corporate":
          setActiveSection("overview");
          break;
        case "database":
          setActiveSection("tables");
          break;
        case "analytics":
          setActiveSection("overview");
          break;
        case "monitoring":
          setActiveSection("alerts");
          break;
        case "admin":
          setActiveSection("housekeeping");
          break;
        default:
          setActiveSection("overview");
      }
    }
  };

  const renderDashboard = () => {
    switch (activeLayer) {
      case "executive":
        return <ExecutiveDashboard section={activeSection} />;
      case "legal":
        return <LegalDashboard section={activeSection} />;
      case "audit":
        return <AuditDashboard section={activeSection} />;
      case "corporate":
        return <CorporateDashboard section={activeSection} />;
      case "database":
        return <DatabaseMonitor section={activeSection} />;
      case "analytics":
        return <CloudInfrastructureDashboard section={activeSection} />;
      case "monitoring":
        return <MonitoringSettingsDashboard section={activeSection} />;
      case "admin":
        return <SystemsAdminDashboard />;
      default:
        return <ExecutiveDashboard section={activeSection} />;
    }
  };

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar
        activeLayer={activeLayer}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        alertCount={unacknowledgedAlerts}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1600px] mx-auto">
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
}
