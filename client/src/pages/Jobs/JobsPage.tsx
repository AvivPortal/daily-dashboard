import { useEffect, useState } from 'react'
import { Plus, ExternalLink, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { jobService } from '../../services/job.service'
import type { JobApplication, JobStatus } from '../../types'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import { formatDate } from '../../utils/format'

const COLUMNS: { status: JobStatus; label: string; color: string; bg: string }[] = [
  { status: 'APPLIED', label: 'הוגש', color: 'text-blue-600', bg: 'bg-blue-50' },
  { status: 'SCREENING', label: 'סינון', color: 'text-purple-600', bg: 'bg-purple-50' },
  { status: 'INTERVIEW', label: 'ראיון', color: 'text-amber-600', bg: 'bg-amber-50' },
  { status: 'OFFER', label: 'הצעה 🎉', color: 'text-sage-700', bg: 'bg-sage-100' },
  { status: 'REJECTED', label: 'נדחה', color: 'text-red-600', bg: 'bg-red-50' },
  { status: 'GHOSTED', label: 'שתיקה', color: 'text-slate-500', bg: 'bg-slate-100' },
]

const emptyForm = { company: '', position: '', status: 'APPLIED' as JobStatus, link: '', notes: '', nextStep: '' }

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [stats, setStats] = useState<{ total: number; byStatus: Record<string, number>; interviewRate: number; responseRate: number } | null>(null)
  const [open, setOpen] = useState(false)
  const [editJob, setEditJob] = useState<JobApplication | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [data, s] = await Promise.all([jobService.getAll(), jobService.getStats()])
    setJobs(data)
    setStats(s)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditJob(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (j: JobApplication) => {
    setEditJob(j)
    setForm({ company: j.company, position: j.position, status: j.status, link: j.link || '', notes: j.notes || '', nextStep: j.nextStep || '' })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, link: form.link || undefined, notes: form.notes || undefined, nextStep: form.nextStep || undefined }
    try {
      if (editJob) {
        const updated = await jobService.update(editJob.id, payload)
        setJobs((p) => p.map((j) => j.id === updated.id ? updated : j))
        toast.success('עודכן')
      } else {
        const created = await jobService.create(payload)
        setJobs((p) => [created, ...p])
        toast.success('הגשה נוספה')
      }
      setOpen(false)
      load()
    } catch {
      toast.error('שגיאה')
    }
  }

  const handleDelete = async (id: string) => {
    await jobService.delete(id)
    setJobs((p) => p.filter((j) => j.id !== id))
    toast.success('נמחק')
    load()
  }

  const jobsByStatus = (status: JobStatus) => jobs.filter((j) => j.status === status)

  return (
    <div>
      <PageHeader
        title="מעקב משרות"
        subtitle={`${stats?.total ?? 0} הגשות | ${stats?.interviewRate ?? 0}% הגיעו לראיון`}
        action={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> הגשה חדשה
          </button>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <p className="text-xs text-slate-500 mb-1">סה"כ הגשות</p>
            <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
          </Card>
          <Card>
            <p className="text-xs text-slate-500 mb-1">שיעור ראיונות</p>
            <p className="text-3xl font-bold text-sage-500">{stats.interviewRate}%</p>
          </Card>
          <Card>
            <p className="text-xs text-slate-500 mb-1">שיעור תגובה</p>
            <p className="text-3xl font-bold text-slate-800">{stats.responseRate}%</p>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colJobs = jobsByStatus(col.status)
            return (
              <div key={col.status} className="rounded-2xl p-4 bg-slate-50/60 min-h-32">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${col.bg.replace('bg-', 'bg-').replace('-50', '-400').replace('-100', '-400')}`} />
                  <h3 className={`font-semibold text-sm ${col.color}`}>{col.label}</h3>
                  <span className="text-xs text-slate-400 mr-auto">{colJobs.length}</span>
                </div>
                <div className="space-y-2">
                  {colJobs.map((job, i) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`${col.bg} rounded-xl p-3 group cursor-pointer`}
                      onClick={() => openEdit(job)}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{job.company}</p>
                          <p className="text-xs text-slate-500 truncate">{job.position}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {job.link && (
                            <a href={job.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 hover:bg-white/60 rounded text-slate-400">
                              <ExternalLink size={11} />
                            </a>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(job.id) }} className="p-1 hover:bg-white/60 rounded text-slate-300 hover:text-red-400">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{formatDate(job.appliedDate)}</p>
                      {job.nextStep && (
                        <p className="text-xs text-slate-600 mt-1 border-t border-white/60 pt-1">→ {job.nextStep}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editJob ? 'עריכת הגשה' : 'הגשה חדשה'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">חברה</label>
              <input type="text" value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} className="input" required />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">תפקיד</label>
              <input type="text" value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))} className="input" required />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">סטטוס</label>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as JobStatus }))} className="input">
              {COLUMNS.map((c) => <option key={c.status} value={c.status}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">קישור למשרה</label>
            <input type="url" value={form.link} onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))} className="input" placeholder="https://..." />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">צעד הבא</label>
            <input type="text" value={form.nextStep} onChange={(e) => setForm((p) => ({ ...p, nextStep: e.target.value }))} className="input" placeholder="לדוגמה: ראיון טכני ב-5.12" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">הערות</label>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="input resize-none" rows={3} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1">{editJob ? 'עדכן' : 'הוסף'}</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">ביטול</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

void Edit2
