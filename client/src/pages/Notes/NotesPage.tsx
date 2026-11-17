import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Pin, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { noteService } from '../../services/note.service'
import type { Note } from '../../types'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import { formatDate } from '../../utils/format'

const NOTE_COLORS = [
  '#ffffff', '#fef9c3', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff', '#ffedd5',
]

const emptyForm = { title: '', content: '', tags: '', color: NOTE_COLORS[0] }

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editNote, setEditNote] = useState<Note | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (q?: string) => {
    setLoading(true)
    const data = await noteService.getAll(q)
    setNotes(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSearch = (q: string) => {
    setSearch(q)
    if (q.length === 0 || q.length >= 2) load(q || undefined)
  }

  const openCreate = () => { setEditNote(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (n: Note) => {
    setEditNote(n)
    setForm({ title: n.title, content: n.content, tags: n.tags.join(', '), color: n.color })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      title: form.title,
      content: form.content,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      color: form.color,
    }
    try {
      if (editNote) {
        const updated = await noteService.update(editNote.id, payload)
        setNotes((p) => p.map((n) => n.id === updated.id ? updated : n))
        toast.success('פתק עודכן')
      } else {
        const created = await noteService.create(payload)
        setNotes((p) => [created, ...p])
        toast.success('פתק נוסף')
      }
      setOpen(false)
    } catch { toast.error('שגיאה') }
  }

  const handleDelete = async (id: string) => {
    await noteService.delete(id)
    setNotes((p) => p.filter((n) => n.id !== id))
    toast.success('פתק נמחק')
  }

  const handleTogglePin = async (note: Note) => {
    const updated = await noteService.update(note.id, { isPinned: !note.isPinned })
    setNotes((p) => p.map((n) => n.id === updated.id ? updated : n).sort((a, b) => Number(b.isPinned) - Number(a.isPinned)))
  }

  const pinned = notes.filter((n) => n.isPinned)
  const unpinned = notes.filter((n) => !n.isPinned)

  return (
    <div>
      <PageHeader
        title="פתקים ויומן"
        subtitle={`${notes.length} פתקים`}
        action={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> פתק חדש
          </button>
        }
      />

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="חיפוש פתקים..."
          className="input pr-9"
        />
        {search && (
          <button onClick={() => handleSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <X size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Pinned */}
          {pinned.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                <Pin size={12} /> פתקים מוצמדים
              </h2>
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3">
                {pinned.map((note) => (
                  <NoteCard key={note.id} note={note} onEdit={openEdit} onDelete={handleDelete} onTogglePin={handleTogglePin} />
                ))}
              </div>
            </div>
          )}

          {/* Regular */}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">שאר הפתקים</h2>}
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3">
                {unpinned.map((note) => (
                  <NoteCard key={note.id} note={note} onEdit={openEdit} onDelete={handleDelete} onTogglePin={handleTogglePin} />
                ))}
              </div>
            </div>
          )}

          {notes.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-3">📝</p>
              <p>אין פתקים עדיין. הוסף פתק ראשון!</p>
            </div>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editNote ? 'עריכת פתק' : 'פתק חדש'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">כותרת</label>
            <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="input" required />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">תוכן</label>
            <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} className="input resize-none" rows={6} placeholder="כתוב כאן..." />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">תגיות (מופרדות בפסיק)</label>
            <input type="text" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} className="input" placeholder="לדוגמה: עבודה, רעיונות" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">צבע</label>
            <div className="flex gap-2 flex-wrap">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${form.color === c ? 'scale-125 border-slate-400' : 'border-slate-200'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1">{editNote ? 'עדכן' : 'הוסף'}</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">ביטול</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  note: Note
  onEdit: (n: Note) => void
  onDelete: (id: string) => void
  onTogglePin: (n: Note) => void
}) {
  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="break-inside-avoid mb-3 rounded-2xl p-4 shadow-card border border-slate-100 cursor-pointer group relative"
        style={{ backgroundColor: note.color }}
        onClick={() => onEdit(note)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-slate-800 text-sm leading-snug">{note.title}</h3>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePin(note) }}
              className={`p-1 rounded-lg transition-colors ${note.isPinned ? 'text-amber-500' : 'text-slate-400 hover:text-amber-400'}`}
            >
              <Pin size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
              className="p-1 rounded-lg text-slate-300 hover:text-red-400 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        {note.content && (
          <p className="text-xs text-slate-600 line-clamp-5 whitespace-pre-wrap">{note.content}</p>
        )}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {note.tags.map((tag) => (
              <span key={tag} className="text-xs bg-white/60 text-slate-500 px-1.5 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-400 mt-2">{formatDate(note.updatedAt)}</p>
      </motion.div>
    </AnimatePresence>
  )
}
