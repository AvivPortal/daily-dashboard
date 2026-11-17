import { useEffect, useState } from 'react'
import { Plus, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { taskService } from '../../services/task.service'
import { telegramService } from '../../services/telegram.service'
import type { Task, TaskStatus, Priority } from '../../types'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import TaskCard from './TaskCard'
import KanbanColumn from './KanbanColumn'

const REMINDER_OPTIONS = [
  { label: '15 דקות לפני', value: 15 },
  { label: 'שעה לפני', value: 60 },
  { label: '3 שעות לפני', value: 180 },
  { label: 'יום לפני', value: 1440 },
  { label: 'יומיים לפני', value: 2880 },
]

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'TODO', label: 'לביצוע', color: 'bg-slate-200' },
  { status: 'IN_PROGRESS', label: 'בתהליך', color: 'bg-amber-200' },
  { status: 'DONE', label: 'הושלם', color: 'bg-sage-100' },
]

const emptyForm = {
  title: '', description: '', priority: 'MEDIUM' as Priority,
  dueDate: '', tags: '', reminderEnabled: false, reminderOffsets: [] as number[],
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [open, setOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [telegramConnected, setTelegramConnected] = useState(false)
  const [linkData, setLinkData] = useState<{ token: string; botName: string } | null>(null)
  const [telegramModalOpen, setTelegramModalOpen] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const load = async () => {
    setLoading(true)
    const [data, tgStatus] = await Promise.all([
      taskService.getAll(),
      telegramService.getStatus().catch(() => ({ connected: false })),
    ])
    setTasks(data)
    setTelegramConnected(tgStatus.connected)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditTask(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (t: Task) => {
    setEditTask(t)
    setForm({
      title: t.title,
      description: t.description || '',
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
      tags: t.tags.join(', '),
      reminderEnabled: t.reminderEnabled,
      reminderOffsets: t.reminderOffsets,
    })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      reminderEnabled: form.reminderEnabled,
      reminderOffsets: form.reminderOffsets,
    }
    try {
      if (editTask) {
        const updated = await taskService.update(editTask.id, payload)
        setTasks((p) => p.map((t) => (t.id === updated.id ? updated : t)))
        toast.success('משימה עודכנה')
      } else {
        const created = await taskService.create(payload)
        setTasks((p) => [...p, created])
        toast.success('משימה נוספה')
      }
      setOpen(false)
    } catch {
      toast.error('שגיאה')
    }
  }

  const handleDelete = async (id: string) => {
    await taskService.delete(id)
    setTasks((p) => p.filter((t) => t.id !== id))
    toast.success('משימה נמחקה')
  }

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    const updated = await taskService.update(id, { status })
    setTasks((p) => p.map((t) => (t.id === updated.id ? updated : t)))
  }

  const handleConnectTelegram = async () => {
    try {
      const data = await telegramService.generateLinkToken()
      setLinkData(data)
      setTelegramModalOpen(true)
      const poll = setInterval(async () => {
        const status = await telegramService.getStatus().catch(() => ({ connected: false }))
        if (status.connected) {
          clearInterval(poll)
          setTelegramConnected(true)
          setTelegramModalOpen(false)
          setLinkData(null)
          toast.success('Telegram חובר בהצלחה!')
        }
      }, 3000)
      setTimeout(() => clearInterval(poll), 5 * 60 * 1000)
    } catch {
      toast.error('שגיאה ביצירת קוד חיבור')
    }
  }

  const handleUnlinkTelegram = async () => {
    await telegramService.unlink()
    setTelegramConnected(false)
    toast.success('Telegram נותק')
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const draggedTask = tasks.find((t) => t.id === active.id)
    const newStatus = over.id as TaskStatus
    if (draggedTask && COLUMNS.some((c) => c.status === newStatus)) {
      await handleStatusChange(String(active.id), newStatus)
    }
  }

  return (
    <div>
      <PageHeader
        title="ניהול משימות"
        subtitle={`${tasks.filter((t) => t.status === 'DONE').length}/${tasks.length} הושלמו`}
        action={
          <div className="flex items-center gap-2">
            {telegramConnected ? (
              <button onClick={handleUnlinkTelegram} className="btn-ghost flex items-center gap-1 text-sm text-sage-600">
                <Bell size={14} className="text-sage-500" /> Telegram מחובר
              </button>
            ) : (
              <button onClick={handleConnectTelegram} className="btn-ghost flex items-center gap-1 text-sm">
                <Bell size={14} /> חבר Telegram
              </button>
            )}
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> משימה חדשה
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map((col) => (
              <KanbanColumn key={col.status} {...col} id={col.status}>
                {tasks
                  .filter((t) => t.status === col.status)
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => openEdit(task)}
                      onDelete={() => handleDelete(task.id)}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
              </KanbanColumn>
            ))}
          </div>
        </DndContext>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editTask ? 'עריכת משימה' : 'משימה חדשה'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">כותרת</label>
            <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="input" required />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">תיאור</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="input resize-none" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">עדיפות</label>
              <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as Priority }))} className="input">
                <option value="LOW">נמוכה</option>
                <option value="MEDIUM">בינונית</option>
                <option value="HIGH">גבוהה</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">תאריך יעד</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">תגיות (מופרדות בפסיק)</label>
            <input type="text" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} className="input" placeholder="לדוגמה: פרויקט, דחוף" />
          </div>

          {form.dueDate && (
            <div className="border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Bell size={14} /> תזכורת ב-Telegram
                </label>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, reminderEnabled: !p.reminderEnabled, reminderOffsets: p.reminderEnabled ? [] : p.reminderOffsets }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.reminderEnabled ? 'bg-sage-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${form.reminderEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>
              {form.reminderEnabled && (
                <>
                  {!telegramConnected && (
                    <p className="text-xs text-amber-600">יש לחבר Telegram תחילה (לחץ על "חבר Telegram" למעלה)</p>
                  )}
                  <div className="space-y-1">
                    {REMINDER_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.reminderOffsets.includes(opt.value)}
                          onChange={(e) => {
                            setForm((p) => ({
                              ...p,
                              reminderOffsets: e.target.checked
                                ? [...p.reminderOffsets, opt.value]
                                : p.reminderOffsets.filter((v) => v !== opt.value),
                            }))
                          }}
                          className="rounded"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1">{editTask ? 'עדכן' : 'הוסף'}</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">ביטול</button>
          </div>
        </form>
      </Modal>

      <Modal open={telegramModalOpen} onClose={() => setTelegramModalOpen(false)} title="חיבור Telegram">
        {linkData && (
          <div className="space-y-4 text-center" dir="rtl">
            <Bell size={40} className="text-sage-500 mx-auto" />
            <p className="text-slate-600">פתח את Telegram ושלח לבוט <strong>@{linkData.botName}</strong> את ההודעה:</p>
            <div className="bg-slate-100 rounded-xl px-6 py-4 text-2xl font-mono font-bold tracking-widest text-slate-800 select-all">
              /start {linkData.token}
            </div>
            <p className="text-xs text-slate-400">הקוד בתוקף ל-5 דקות. ממתין לאישור...</p>
            <div className="flex justify-center">
              <div className="w-5 h-5 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
