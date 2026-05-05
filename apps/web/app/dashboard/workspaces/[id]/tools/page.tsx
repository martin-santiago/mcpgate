import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { ToolsCatalog } from '@/components/dashboard/tools-catalog'

type Props = {
  params: Promise<{ id: string }>
}

export default async function WorkspaceToolsPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="space-y-8">
      <div>
        <nav className="flex items-center gap-1 text-xs text-zinc-500 mb-3">
          <Link href="/dashboard/workspaces" className="hover:text-zinc-300 transition-colors">
            Workspaces
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link
            href={`/dashboard/workspaces/${id}`}
            className="hover:text-zinc-300 transition-colors"
          >
            Sources
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-300">Tools</span>
        </nav>
        <h1 className="text-2xl font-semibold text-white">Tools</h1>
        <p className="text-sm text-zinc-400 mt-1">Enable or disable tools exposed to this workspace</p>
      </div>

      <ToolsCatalog workspaceId={id} />
    </div>
  )
}
