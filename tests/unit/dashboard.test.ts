import { describe, it, expect } from "vitest";
import { renderDashboard, type DashboardData } from "../../src/dashboard/templates.js";

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
};

describe("Dashboard templates", () => {
  it("renders valid HTML document", () => {
    const html = renderDashboard(testDashboardData);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
    expect(html).toContain("<title>");
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

  it("renders tools table with status badges", () => {
    const html = renderDashboard(testDashboardData);

    expect(html).toContain("filesystem.read_file");
    expect(html).toContain("filesystem.delete_file");
    expect(html).toContain("active");
    expect(html).toContain("filtered");
  });

  it("renders request logs", () => {
    const html = renderDashboard(testDashboardData);

    expect(html).toContain("read_file");
    expect(html).toContain("create_issue");
    expect(html).toContain("45ms");
    expect(html).toContain("Timeout");
  });

  it("renders stat cards with correct numbers", () => {
    const html = renderDashboard(testDashboardData);

    // Upstream count
    expect(html).toContain(">2<");
    // Active tools
    expect(html).toContain(">3<");
    // Filtered tools
    expect(html).toContain(">2<");
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
    };

    const html = renderDashboard(emptyData);

    expect(html).toContain("empty-gateway");
    expect(html).toContain("No upstream servers configured");
    expect(html).toContain("No tools registered");
    expect(html).toContain("No requests logged yet");
  });
});
