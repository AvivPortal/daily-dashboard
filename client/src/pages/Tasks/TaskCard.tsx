import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Edit2, Trash2, ChevronRight } from 'lucide-react'
import type { Task, TaskStatus } from '../../types'
import { formatDateTime, isOverdue } from '../../utils/format'

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-slate-100 text-slate-500',
}

const PRIORITY_LABEL: Record<string, string> = {
  HIGH: 'גבוהה', MEDIUM: 'בינונית', LOW: 'נמוכה',
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: null,
}

interface Props {
  task: Task
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (id: string, status: TaskStatus) => void
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const overdue = isOverdue(task.dueDate) && task.status !== 'DONE'
  const nextStatus = NEXT_STATUS[task.status]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-xl p-3 shadow-card border border-slate-100 cursor-grab active:cursor-grabbing group"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-700 leading-snug flex-1">{task.title}</p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {nextStatus && (
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, nextStatus) }}
              className="p-1 hover:bg-sage-100 rounded-lg text-sage-600 transition-colors"
              title="קדם סטטוס"
            >
              <ChevronRight size={12} />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onEdit() }} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <Edit2 size={12} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-400 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`badge text-xs ${PRIORITY_COLOR[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
        {task.tags.map((tag) => (
          <span key={tag} className="badge bg-slate-100 text-slate-500 text-xs">{tag}</span>
        ))}
        {task.dueDate && (
          <span className={`text-xs ${overdue ? 'text-red-500 font-medium' : 'text-slate-400'} mr-auto`}>
            {overdue ? '⚠ ' : ''}{formatDateTime(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  )
}
