import { createClient } from '@/lib/supabase/server'
import { Server, Wrench, FolderOpen, Activity } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Overview</h1>
        <p className="text-sm text-zinc-400 mt-1">Welcome back, {user?.email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          href="/dashboard/workspaces"
          icon={<FolderOpen className="w-5 h-5 text-zinc-400" />}
          label="Workspaces"
          description="Organize your MCP environments"
        />
        <StatCard
          href="/dashboard/sources"
          icon={<Server className="w-5 h-5 text-zinc-400" />}
          label="Sources"
          description="Connect MCP servers"
        />
        <StatCard
          href="/dashboard/tools"
          icon={<Wrench className="w-5 h-5 text-zinc-400" />}
          label="Tools"
          description="Enable or disable tools per workspace"
        />
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-medium text-zinc-300">Getting started</h2>
        </div>
        <ol className="space-y-3 text-sm text-zinc-400 list-decimal list-inside">
          <li>
            <Link href="/dashboard/workspaces" className="text-white hover:underline">
              Create a workspace
            </Link>{' '}
            — a logical group for a team or project
          </li>
          <li>
            <Link href="/dashboard/sources" className="text-white hover:underline">
              Add a source
            </Link>{' '}
            — connect an MCP server (stdio or HTTP)
          </li>
          <li>
            <Link href="/dashboard/tools" className="text-white hover:underline">
              Review tools
            </Link>{' '}
            — enable or disable individual tools per workspace
          </li>
        </ol>
      </div>
    </div>
  )
}

type StatCardProps = {
  href: string
  icon: React.ReactNode
  label: string
  description: string
}

function StatCard({ href, icon, label, description }: StatCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600 transition-colors"
    >
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
      <p className="text-xs text-zinc-500">{description}</p>
    </Link>
  )
}
