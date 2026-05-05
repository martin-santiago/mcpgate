'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { Tool } from '@/lib/api/types'
import { Loader2, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const capabilityColor: Record<Tool['capability'], string> = {
  read: 'text-blue-400 bg-blue-400/10',
  write: 'text-orange-400 bg-orange-400/10',
  admin: 'text-red-400 bg-red-400/10',
  unknown: 'text-zinc-400 bg-zinc-700/40',
}

type Props = {
  workspaceId: string
}

export function ToolsCatalog({ workspaceId }: Props) {
  const queryClient = useQueryClient()

  const { data: tools = [], isLoading } = useQuery<Tool[]>({
    queryKey: ['tools', workspaceId],
    queryFn: () => api.get<Tool[]>(`/workspaces/${workspaceId}/tools`),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<Tool>(`/workspaces/${workspaceId}/tools/${id}`, { isActive }),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['tools', workspaceId] })
      const previous = queryClient.getQueryData<Tool[]>(['tools', workspaceId])
      queryClient.setQueryData<Tool[]>(['tools', workspaceId], (old = []) =>
        old.map((t) => (t.id === id ? { ...t, isActive } : t))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['tools', workspaceId], context.previous)
      }
      toast.error('Failed to update tool')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', workspaceId] })
    },
  })

  const batchMutation = useMutation({
    mutationFn: ({ toolIds, isActive }: { toolIds: string[]; isActive: boolean }) =>
      api.post(`/workspaces/${workspaceId}/tools/batch-toggle`, { toolIds, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', workspaceId] })
      toast.success('Tools updated')
    },
    onError: () => toast.error('Batch update failed'),
  })

  function handleEnableAll() {
    const ids = tools.filter((t) => !t.isActive).map((t) => t.id)
    if (ids.length) batchMutation.mutate({ toolIds: ids, isActive: true })
  }

  function handleDisableAll() {
    const ids = tools.filter((t) => t.isActive).map((t) => t.id)
    if (ids.length) batchMutation.mutate({ toolIds: ids, isActive: false })
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-zinc-400 text-sm py-8">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading tools...
      </div>
    )
  }

  if (tools.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-zinc-800 rounded-lg">
        <Wrench className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
        <p className="text-sm text-zinc-400">No tools discovered yet.</p>
        <p className="text-xs text-zinc-600 mt-1">
          Connect a source and run a sync to populate tools.
        </p>
      </div>
    )
  }

  const activeCount = tools.filter((t) => t.isActive).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {activeCount} of {tools.length} tools enabled
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDisableAll}
            disabled={batchMutation.isPending}
            className="text-xs text-zinc-400 hover:text-white transition-colors px-3 py-1.5 border border-zinc-700 rounded-md"
          >
            Disable all
          </button>
          <button
            onClick={handleEnableAll}
            disabled={batchMutation.isPending}
            className="text-xs text-zinc-400 hover:text-white transition-colors px-3 py-1.5 border border-zinc-700 rounded-md"
          >
            Enable all
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Tool</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Capability</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden md:table-cell">
                Description
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Active</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool) => (
              <tr key={tool.id} className="border-b border-zinc-800 last:border-0 bg-zinc-900">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{tool.name}</span>
                    <span className="text-xs text-zinc-600 font-mono">{tool.toolKey}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                      capabilityColor[tool.capability]
                    )}
                  >
                    {tool.capability}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs hidden md:table-cell max-w-xs truncate">
                  {tool.description || '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Toggle
                    checked={tool.isActive}
                    onChange={(val) => toggleMutation.mutate({ id: tool.id, isActive: val })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none',
        checked ? 'bg-white' : 'bg-zinc-700'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full shadow transition-transform',
          checked ? 'translate-x-4 bg-zinc-900' : 'translate-x-0 bg-zinc-400'
        )}
      />
    </button>
  )
}
