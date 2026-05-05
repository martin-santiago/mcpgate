import type { GatewayStatus } from "../gateway/gateway.js";
import type { RegisteredTool } from "../gateway/tool-registry.js";
import type { RequestLogEntry, RequestStats } from "../storage/storage.js";
import { MCPGATE_NAME, MCPGATE_VERSION } from "../utils/constants.js";

export type DashboardData = {
  gatewayStatus: GatewayStatus;
  registeredTools: RegisteredTool[];
  recentLogs: RequestLogEntry[];
  requestStats: RequestStats;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statusBadge(status: string): string {
  const colorMap: Record<string, string> = {
    running: "#22c55e",
    connected: "#22c55e",
    active: "#22c55e",
    starting: "#eab308",
    connecting: "#eab308",
    stopped: "#6b7280",
    disconnected: "#6b7280",
    filtered: "#f97316",
    error: "#ef4444",
  };

  const color = colorMap[status] ?? "#6b7280";
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;color:#fff;background:${color}">${escapeHtml(status)}</span>`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatTimestamp(date: Date): string {
  return new Date(date).toLocaleString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function renderUpstreamsTable(upstreams: GatewayStatus["upstreams"]): string {
  if (upstreams.length === 0) {
    return `<p style="color:#6b7280">No upstream servers configured</p>`;
  }

  const rows = upstreams
    .map(
      (upstream) => `
      <tr>
        <td>${escapeHtml(upstream.name)}</td>
        <td>${statusBadge(upstream.status)}</td>
        <td>${upstream.toolCount}</td>
        <td>${upstream.errorMessage ? escapeHtml(upstream.errorMessage) : "—"}</td>
      </tr>`
    )
    .join("");

  return `
    <table>
      <thead>
        <tr><th>Server</th><th>Status</th><th>Tools</th><th>Error</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderLogsTable(recentLogs: RequestLogEntry[]): string {
  if (recentLogs.length === 0) {
    return `<p style="color:#6b7280">No requests logged yet</p>`;
  }

  const rows = recentLogs
    .map(
      (logEntry) => `
      <tr>
        <td>${formatTimestamp(logEntry.timestamp)}</td>
        <td>${escapeHtml(logEntry.serverName)}</td>
        <td><code>${escapeHtml(logEntry.toolName)}</code></td>
        <td>${formatDuration(logEntry.durationMs)}</td>
        <td>${logEntry.success ? statusBadge("active") : statusBadge("error")}</td>
        <td>${logEntry.errorMessage ? escapeHtml(logEntry.errorMessage) : "—"}</td>
      </tr>`
    )
    .join("");

  return `
    <table>
      <thead>
        <tr><th>Time</th><th>Server</th><th>Tool</th><th>Duration</th><th>Result</th><th>Error</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderStatsCards(
  gatewayStatus: GatewayStatus,
  requestStats: RequestStats
): string {
  const successRate =
    requestStats.totalRequests > 0
      ? Math.round((requestStats.successfulRequests / requestStats.totalRequests) * 100)
      : 100;

  const successRateColor =
    successRate >= 95 ? "#22c55e" : successRate >= 80 ? "#eab308" : "#ef4444";

  return `
    <div class="cards">
      <div class="card">
        <div class="label">Upstream Servers</div>
        <div class="value">${gatewayStatus.upstreams.length}</div>
      </div>
      <div class="card">
        <div class="label">Active Tools</div>
        <div class="value">${gatewayStatus.tools.active}</div>
      </div>
      <div class="card">
        <div class="label">Total Requests</div>
        <div class="value">${requestStats.totalRequests}</div>
      </div>
      <div class="card">
        <div class="label">Success Rate</div>
        <div class="value" style="color:${successRateColor}">${successRate}%</div>
      </div>
      <div class="card">
        <div class="label">Avg Latency</div>
        <div class="value">${formatDuration(requestStats.averageDurationMs)}</div>
      </div>
      <div class="card">
        <div class="label">P95 Latency</div>
        <div class="value">${formatDuration(requestStats.p95DurationMs)}</div>
      </div>
    </div>`;
}

function renderToolStatsTable(
  registeredTools: RegisteredTool[],
  requestStats: RequestStats
): string {
  if (registeredTools.length === 0) {
    return `<p style="color:#6b7280">No tools registered</p>`;
  }

  const toolStatsMap = new Map(
    requestStats.toolBreakdown.map((toolStat) => [
      `${toolStat.serverName}.${toolStat.toolName}`,
      toolStat,
    ])
  );

  const rows = registeredTools
    .map((tool) => {
      const toolStat = toolStatsMap.get(tool.exposedName);
      const callCount = toolStat?.callCount ?? 0;
      const successRate =
        callCount > 0 ? Math.round(((toolStat?.successCount ?? 0) / callCount) * 100) : 0;
      const avgDuration = toolStat?.averageDurationMs ?? 0;

      return `
      <tr>
        <td><code>${escapeHtml(tool.exposedName)}</code></td>
        <td>${escapeHtml(tool.serverName)}</td>
        <td>${statusBadge(tool.status)}</td>
        <td>${callCount > 0 ? callCount : "—"}</td>
        <td>${callCount > 0 ? `${successRate}%` : "—"}</td>
        <td>${callCount > 0 ? formatDuration(avgDuration) : "—"}</td>
        <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(tool.description || "—")}</td>
      </tr>`;
    })
    .join("");

  return `
    <table>
      <thead>
        <tr><th>Tool</th><th>Server</th><th>Status</th><th>Calls</th><th>Success</th><th>Avg</th><th>Description</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export function renderDashboard(data: DashboardData): string {
  const { gatewayStatus, registeredTools, recentLogs, requestStats } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="10">
  <title>${escapeHtml(gatewayStatus.name)} — ${MCPGATE_NAME} Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; }
    .container { max-width: 1400px; margin: 0 auto; }
    header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
    header h1 { font-size: 24px; font-weight: 700; }
    header .meta { color: #64748b; font-size: 13px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .card { background: #1e293b; border-radius: 8px; padding: 20px; }
    .card .label { color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .card .value { font-size: 28px; font-weight: 700; }
    section { background: #1e293b; border-radius: 8px; padding: 24px; margin-bottom: 24px; }
    section h2 { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px 12px; border-bottom: 1px solid #334155; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 8px 12px; border-bottom: 1px solid #1e293b; font-size: 13px; }
    tr:hover td { background: #334155; }
    code { background: #334155; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    .footer { color: #475569; font-size: 12px; margin-top: 8px; }
    .footer a { color: #38bdf8; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
    .auto-refresh { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #22c55e; margin-right: 6px; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>${escapeHtml(gatewayStatus.name)}</h1>
        <span class="meta">${MCPGATE_NAME} v${MCPGATE_VERSION}</span>
      </div>
      <div>
        ${statusBadge(gatewayStatus.status)}
      </div>
    </header>

    ${renderStatsCards(gatewayStatus, requestStats)}

    <section>
      <h2>Upstream Servers</h2>
      ${renderUpstreamsTable(gatewayStatus.upstreams)}
    </section>

    <section>
      <h2>Tools (${gatewayStatus.tools.total} total, ${gatewayStatus.tools.filtered} filtered)</h2>
      ${renderToolStatsTable(registeredTools, requestStats)}
    </section>

    <section>
      <h2>Recent Requests (last 50)</h2>
      ${renderLogsTable(recentLogs)}
    </section>

    <p class="footer">
      <span class="auto-refresh"></span>Auto-refreshing every 10s &middot;
      <a href="/api/status">JSON API</a> &middot;
      <a href="/health">Health</a>
    </p>
  </div>
</body>
</html>`;
}
