'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { Workspace } from '@/lib/api/types'
import { useState } from 'react'
import { Plus, FolderOpen, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export function WorkspacesList() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const { data: workspaces = [], isLoading } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: () => api.get<Workspace[]>('/workspaces'),
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post<Workspace>('/workspaces', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      setOpen(false)
      setName('')
      toast.success('Workspace created')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate(name.trim())
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-white text-zinc-900 text-sm font-medium px-4 py-2 rounded-md hover:bg-zinc-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New workspace
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-zinc-400 text-sm py-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      ) : workspaces.length === 0 ? (
        <EmptyState onNew={() => setOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} />
          ))}
        </div>
      )}

      {open && (
        <Modal title="New workspace" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Name</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production, Staging, Dev"
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-500 placeholder:text-zinc-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || !name.trim()}
                className="flex items-center gap-2 bg-white text-zinc-900 text-sm font-medium px-4 py-2 rounded-md hover:bg-zinc-100 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <Link
      href={`/dashboard/workspaces/${workspace.id}`}
      className="block rounded-lg border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600 transition-colors"
    >
      <div className="flex items-center gap-3 mb-3">
        <FolderOpen className="w-4 h-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-medium text-white truncate">{workspace.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            workspace.status === 'active' ? 'bg-green-500' : 'bg-zinc-500'
          }`}
        />
        <span className="text-xs text-zinc-500 capitalize">{workspace.status}</span>
      </div>
    </Link>
  )
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="text-center py-16 border border-dashed border-zinc-800 rounded-lg">
      <FolderOpen className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
      <p className="text-sm text-zinc-400 mb-4">No workspaces yet</p>
      <button
        onClick={onNew}
        className="text-sm text-white underline underline-offset-2 hover:text-zinc-300 transition-colors"
      >
        Create your first workspace
      </button>
    </div>
  )
}

type ModalProps = {
  title: string
  onClose: () => void
  children: React.ReactNode
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm mx-4 p-6 shadow-xl">
        <h2 className="text-base font-semibold text-white mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}
