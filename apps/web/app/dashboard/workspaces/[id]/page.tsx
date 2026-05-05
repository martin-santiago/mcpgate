import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { SourcesList } from '@/components/dashboard/sources-list'

type Props = {
  params: Promise<{ id: string }>
}

export default async function WorkspaceDetailPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="space-y-8">
      <div>
        <nav className="flex items-center gap-1 text-xs text-zinc-500 mb-3">
          <Link href="/dashboard/workspaces" className="hover:text-zinc-300 transition-colors">
            Workspaces
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-300">Detail</span>
        </nav>
        <h1 className="text-2xl font-semibold text-white">Sources</h1>
        <p className="text-sm text-zinc-400 mt-1">MCP servers connected to this workspace</p>
      </div>

      <SourcesList workspaceId={id} />
    </div>
  )
}
