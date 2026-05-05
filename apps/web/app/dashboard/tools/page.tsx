import Link from 'next/link'
import { FolderOpen } from 'lucide-react'

export default function ToolsIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Tools</h1>
        <p className="text-sm text-zinc-400 mt-1">Tools are managed per workspace</p>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 flex items-start gap-4">
        <FolderOpen className="w-5 h-5 text-zinc-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-zinc-300 font-medium mb-1">Select a workspace first</p>
          <p className="text-sm text-zinc-500">
            Tools are discovered per workspace and source. Go to{' '}
            <Link
              href="/dashboard/workspaces"
              className="text-white underline underline-offset-2 hover:text-zinc-300 transition-colors"
            >
              Workspaces
            </Link>
            , open a workspace, and manage tools from the sources view.
          </p>
        </div>
      </div>
    </div>
  )
}
