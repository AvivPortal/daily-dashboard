import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ReactNode } from 'react'

interface Props {
  id: string
  label: string
  color: string
  children: ReactNode
}

export default function KanbanColumn({ id, label, color, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const childArray = Array.isArray(children) ? children : children ? [children] : []
  const ids = childArray
    .filter((c): c is React.ReactElement<{ task: { id: string } }> => !!c && typeof c === 'object' && 'props' in (c as object))
    .map((c) => c.props.task?.id ?? '')
    .filter(Boolean)

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl p-4 min-h-64 transition-colors ${isOver ? 'ring-2 ring-sage-300 bg-sage-100/30' : 'bg-slate-50/60'}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <h3 className="font-semibold text-slate-700 text-sm">{label}</h3>
        <span className="text-xs text-slate-400 mr-auto">{ids.length}</span>
      </div>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">{children}</div>
      </SortableContext>
    </div>
  )
}
