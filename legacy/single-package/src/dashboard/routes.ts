import { Hono } from "hono";
import type { Gateway } from "../gateway/gateway.js";
import { renderDashboard } from "./templates.js";

export function createDashboardRoutes(gateway: Gateway): Hono {
  const dashboardApp = new Hono();

  dashboardApp.get("/", async (context) => {
    const gatewayStatus = gateway.getStatus();
    const registeredTools = gateway.getRegisteredTools();
    const recentLogs = await gateway.getRecentLogs(50);
    const requestStats = await gateway.getRequestStats();

    const html = renderDashboard({
      gatewayStatus,
      registeredTools,
      recentLogs,
      requestStats,
    });

    return context.html(html);
  });

  dashboardApp.get("/api/status", async (context) => {
    const gatewayStatus = gateway.getStatus();
    const recentLogs = await gateway.getRecentLogs(50);
    const requestStats = await gateway.getRequestStats();

    return context.json({
      ...gatewayStatus,
      requestStats,
      recentLogs,
    });
  });

  return dashboardApp;
}
