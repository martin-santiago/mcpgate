import type { GatewayStatus } from "../gateway/gateway.js";
import type { RegisteredTool } from "../gateway/tool-registry.js";
import type { RequestLogEntry } from "../storage/storage.js";
import { MCPGATE_NAME, MCPGATE_VERSION } from "../utils/constants.js";

export type DashboardData = {
  gatewayStatus: GatewayStatus;
  registeredTools: RegisteredTool[];
  recentLogs: RequestLogEntry[];
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function renderToolsTable(registeredTools: RegisteredTool[]): string {
  if (registeredTools.length === 0) {
    return `<p style="color:#6b7280">No tools registered</p>`;
  }

  const rows = registeredTools
    .map(
      (tool) => `
      <tr>
        <td><code>${escapeHtml(tool.exposedName)}</code></td>
        <td>${escapeHtml(tool.serverName)}</td>
        <td>${statusBadge(tool.status)}</td>
        <td>${escapeHtml(tool.description || "—")}</td>
      </tr>`
    )
    .join("");

  return `
    <table>
      <thead>
        <tr><th>Tool</th><th>Server</th><th>Status</th><th>Description</th></tr>
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

export function renderDashboard(data: DashboardData): string {
  const { gatewayStatus, registeredTools, recentLogs } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(gatewayStatus.name)} — ${MCPGATE_NAME} Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
    header h1 { font-size: 24px; font-weight: 700; }
    header .version { color: #64748b; font-size: 14px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .card { background: #1e293b; border-radius: 8px; padding: 20px; }
    .card .label { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .card .value { font-size: 28px; font-weight: 700; }
    section { background: #1e293b; border-radius: 8px; padding: 24px; margin-bottom: 24px; }
    section h2 { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px 12px; border-bottom: 1px solid #334155; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 8px 12px; border-bottom: 1px solid #1e293b; font-size: 14px; }
    tr:hover td { background: #334155; }
    code { background: #334155; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    .refresh { color: #64748b; font-size: 12px; }
    a { color: #38bdf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>${escapeHtml(gatewayStatus.name)}</h1>
        <span class="version">${MCPGATE_NAME} v${MCPGATE_VERSION}</span>
      </div>
      <div>
        ${statusBadge(gatewayStatus.status)}
      </div>
    </header>

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
        <div class="label">Filtered Tools</div>
        <div class="value">${gatewayStatus.tools.filtered}</div>
      </div>
      <div class="card">
        <div class="label">Recent Requests</div>
        <div class="value">${recentLogs.length}</div>
      </div>
    </div>

    <section>
      <h2>Upstream Servers</h2>
      ${renderUpstreamsTable(gatewayStatus.upstreams)}
    </section>

    <section>
      <h2>Tools (${gatewayStatus.tools.total} total)</h2>
      ${renderToolsTable(registeredTools)}
    </section>

    <section>
      <h2>Recent Requests</h2>
      ${renderLogsTable(recentLogs)}
    </section>

    <p class="refresh">
      <a href="/">Refresh</a> &middot;
      <a href="/api/status">JSON API</a> &middot;
      <a href="/health">Health</a>
    </p>
  </div>
</body>
</html>`;
}
