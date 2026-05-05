'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { Source, SourceType } from '@/lib/api/types'
import { useState } from 'react'
import { Plus, Server, Loader2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: 'custom', label: 'Custom' },
  { value: 'supabase', label: 'Supabase' },
  { value: 'slack', label: 'Slack' },
]

const statusIcon: Record<Source['status'], React.ReactNode> = {
  connected: <CheckCircle className="w-3.5 h-3.5 text-green-500" />,
  disconnected: <XCircle className="w-3.5 h-3.5 text-zinc-500" />,
  error: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
  pending: <Clock className="w-3.5 h-3.5 text-yellow-500" />,
}

type Props = {
  workspaceId: string
}

export function SourcesList({ workspaceId }: Props) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<SourceType>('custom')

  const { data: sources = [], isLoading } = useQuery<Source[]>({
    queryKey: ['sources', workspaceId],
    queryFn: () => api.get<Source[]>(`/workspaces/${workspaceId}/sources`),
  })

  const createMutation = useMutation({
    mutationFn: (body: { name: string; type: SourceType }) =>
      api.post<Source>(`/workspaces/${workspaceId}/sources`, { ...body, config: {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources', workspaceId] })
      setOpen(false)
      setName('')
      setType('custom')
      toast.success('Source added')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const testMutation = useMutation({
    mutationFn: (sourceId: string) =>
      api.post(`/workspaces/${workspaceId}/sources/${sourceId}/test`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources', workspaceId] })
      toast.success('Connection tested')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate({ name: name.trim(), type })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-white text-zinc-900 text-sm font-medium px-4 py-2 rounded-md hover:bg-zinc-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add source
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-zinc-400 text-sm py-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      ) : sources.length === 0 ? (
        <EmptyState onNew={() => setOpen(true)} />
      ) : (
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Tools</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b border-zinc-800 last:border-0 bg-zinc-900">
                  <td className="px-4 py-3 text-white font-medium">{source.name}</td>
                  <td className="px-4 py-3 text-zinc-400 capitalize">{source.type}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-zinc-400 capitalize">
                      {statusIcon[source.status]}
                      {source.status}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/workspaces/${workspaceId}/tools?sourceId=${source.id}`}
                      className="text-xs text-zinc-400 hover:text-white transition-colors underline underline-offset-2"
                    >
                      View tools
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => testMutation.mutate(source.id)}
                      disabled={testMutation.isPending}
                      className="text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      Test
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Modal title="Add source" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Name</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Supabase MCP"
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-500 placeholder:text-zinc-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SourceType)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                {SOURCE_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
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
                Add
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="text-center py-16 border border-dashed border-zinc-800 rounded-lg">
      <Server className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
      <p className="text-sm text-zinc-400 mb-4">No sources connected yet</p>
      <button
        onClick={onNew}
        className="text-sm text-white underline underline-offset-2 hover:text-zinc-300 transition-colors"
      >
        Add your first source
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
