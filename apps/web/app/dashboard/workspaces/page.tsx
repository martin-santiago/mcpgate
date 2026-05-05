import { WorkspacesList } from '@/components/dashboard/workspaces-list'

export default function WorkspacesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Workspaces</h1>
        <p className="text-sm text-zinc-400 mt-1">Logical environments for your MCP tools</p>
      </div>
      <WorkspacesList />
    </div>
  )
}
