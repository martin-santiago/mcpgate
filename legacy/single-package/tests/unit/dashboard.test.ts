import { describe, it, expect } from "vitest";
import { renderDashboard, type DashboardData } from "../../src/dashboard/templates.js";
import type { RequestStats } from "../../src/storage/storage.js";

const testRequestStats: RequestStats = {
  totalRequests: 2,
  successfulRequests: 1,
  failedRequests: 1,
  averageDurationMs: 772,
  p95DurationMs: 1500,
  toolBreakdown: [
    {
      serverName: "filesystem",
      toolName: "read_file",
      callCount: 1,
      successCount: 1,
      averageDurationMs: 45,
    },
    {
      serverName: "github",
      toolName: "create_issue",
      callCount: 1,
      successCount: 0,
      averageDurationMs: 1500,
    },
  ],
};

const testDashboardData: DashboardData = {
  gatewayStatus: {
    name: "test-gateway",
    status: "running",
    upstreams: [
      { name: "filesystem", status: "connected", toolCount: 3 },
      {
        name: "github",
        status: "error",
        toolCount: 0,
        errorMessage: "Connection refused",
      },
    ],
    tools: { total: 5, active: 3, filtered: 2 },
  },
  registeredTools: [
    {
      originalName: "read_file",
      exposedName: "filesystem.read_file",
      serverName: "filesystem",
      description: "Read a file",
      inputSchema: { type: "object" as const },
      status: "active",
    },
    {
      originalName: "delete_file",
      exposedName: "filesystem.delete_file",
      serverName: "filesystem",
      description: "Delete a file",
      inputSchema: { type: "object" as const },
      status: "filtered",
    },
  ],
  recentLogs: [
    {
      timestamp: new Date("2026-04-05T12:00:00Z"),
      serverName: "filesystem",
      toolName: "read_file",
      durationMs: 45,
      success: true,
    },
    {
      timestamp: new Date("2026-04-05T12:01:00Z"),
      serverName: "github",
      toolName: "create_issue",
      durationMs: 1500,
      success: false,
      errorMessage: "Timeout",
    },
  ],
  requestStats: testRequestStats,
};

const emptyRequestStats: RequestStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageDurationMs: 0,
  p95DurationMs: 0,
  toolBreakdown: [],
};

describe("Dashboard templates", () => {
  it("renders valid HTML document with auto-refresh", () => {
    const html = renderDashboard(testDashboardData);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
    expect(html).toContain('<meta http-equiv="refresh" content="10">');
  });

  it("renders gateway name and status", () => {
    const html = renderDashboard(testDashboardData);

    expect(html).toContain("test-gateway");
    expect(html).toContain("running");
  });

  it("renders upstream servers table", () => {
    const html = renderDashboard(testDashboardData);

    expect(html).toContain("filesystem");
    expect(html).toContain("github");
    expect(html).toContain("connected");
    expect(html).toContain("Connection refused");
  });

  it("renders tools table with per-tool stats", () => {
    const html = renderDashboard(testDashboardData);

    expect(html).toContain("filesystem.read_file");
    expect(html).toContain("filesystem.delete_file");
    expect(html).toContain("active");
    expect(html).toContain("filtered");
    expect(html).toContain("45ms");
    expect(html).toContain("100%");
  });

  it("renders request logs", () => {
    const html = renderDashboard(testDashboardData);

    expect(html).toContain("read_file");
    expect(html).toContain("create_issue");
    expect(html).toContain("Timeout");
  });

  it("renders aggregate stats cards", () => {
    const html = renderDashboard(testDashboardData);

    expect(html).toContain("Total Requests");
    expect(html).toContain("Success Rate");
    expect(html).toContain("Avg Latency");
    expect(html).toContain("P95 Latency");
    expect(html).toContain("50%");
    expect(html).toContain("772ms");
  });

  it("escapes HTML in user-provided strings", () => {
    const xssData: DashboardData = {
      ...testDashboardData,
      gatewayStatus: {
        ...testDashboardData.gatewayStatus,
        name: '<script>alert("xss")</script>',
      },
    };

    const html = renderDashboard(xssData);

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes single quotes", () => {
    const singleQuoteData: DashboardData = {
      ...testDashboardData,
      gatewayStatus: {
        ...testDashboardData.gatewayStatus,
        name: "test's gateway",
      },
    };

    const html = renderDashboard(singleQuoteData);
    expect(html).toContain("&#39;");
    expect(html).not.toContain("test's");
  });

  it("handles empty data gracefully", () => {
    const emptyData: DashboardData = {
      gatewayStatus: {
        name: "empty-gateway",
        status: "stopped",
        upstreams: [],
        tools: { total: 0, active: 0, filtered: 0 },
      },
      registeredTools: [],
      recentLogs: [],
      requestStats: emptyRequestStats,
    };

    const html = renderDashboard(emptyData);

    expect(html).toContain("empty-gateway");
    expect(html).toContain("No upstream servers configured");
    expect(html).toContain("No tools registered");
    expect(html).toContain("No requests logged yet");
    expect(html).toContain("100%");
  });
});
