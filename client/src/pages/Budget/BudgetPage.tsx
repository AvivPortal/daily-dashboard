import { useEffect, useState } from 'react'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { expenseService } from '../../services/expense.service'
import type { Expense, ExpenseSummary } from '../../types'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import { formatCurrency, formatDate } from '../../utils/format'
import { motion } from 'framer-motion'

const CATEGORIES = [
  'שכר דירה', 'גן / חינוך', 'מזון', 'מסעדות', 'תחבורה',
  'בריאות', 'בידור', 'קניות', 'חשבונות', 'אחר',
]

const MONTH_NAMES = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ']

const PIE_COLORS = ['#84a98c', '#6b9e78', '#52917e', '#3a8484', '#5b6fa8', '#8f6bab', '#c06b6b', '#c8955c', '#c8c45c', '#7d7d7d']

const emptyForm = { amount: '', category: CATEGORIES[0], description: '', date: new Date().toISOString().split('T')[0], isRecurring: false }

export default function BudgetPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const now = new Date()

  const load = async () => {
    setLoading(true)
    const [exps, sum] = await Promise.all([
      expenseService.getAll({ month: now.getMonth() + 1, year: now.getFullYear() }),
      expenseService.getSummary(now.getFullYear()),
    ])
    setExpenses(exps)
    setSummary(sum)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const exp = await expenseService.create({
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description || undefined,
        date: form.date,
        isRecurring: form.isRecurring,
      })
      setExpenses((p) => [exp, ...p])
      setSummary((s) => s ? { ...s, totalThisMonth: s.totalThisMonth + exp.amount } : s)
      setOpen(false)
      setForm(emptyForm)
      toast.success('הוצאה נוספה')
    } catch {
      toast.error('שגיאה בהוספת הוצאה')
    }
  }

  const handleDelete = async (id: string) => {
    const exp = expenses.find((e) => e.id === id)
    await expenseService.delete(id)
    setExpenses((p) => p.filter((e) => e.id !== id))
    if (exp) setSummary((s) => s ? { ...s, totalThisMonth: s.totalThisMonth - exp.amount } : s)
    toast.success('הוצאה נמחקה')
  }

  const barData = Array.from({ length: 12 }, (_, i) => ({
    name: MONTH_NAMES[i],
    סכום: summary?.byMonth[i + 1] || 0,
  }))

  const pieData = Object.entries(summary?.byCategory ?? {}).map(([name, value]) => ({ name, value }))

  return (
    <div>
      <PageHeader
        title="תקציב והוצאות"
        subtitle={`${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`}
        action={
          <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            הוצאה חדשה
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <p className="text-xs text-slate-500 mb-1">סה"כ החודש</p>
              <p className="text-3xl font-bold text-slate-800">{formatCurrency(summary?.totalThisMonth ?? 0)}</p>
            </Card>
            <Card>
              <p className="text-xs text-slate-500 mb-1">מספר הוצאות</p>
              <p className="text-3xl font-bold text-slate-800">{expenses.length}</p>
            </Card>
            <Card>
              <p className="text-xs text-slate-500 mb-1">ממוצע להוצאה</p>
              <p className="text-3xl font-bold text-slate-800">
                {expenses.length ? formatCurrency((summary?.totalThisMonth ?? 0) / expenses.length) : '—'}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Bar Chart */}
            <Card>
              <h2 className="font-semibold text-slate-800 mb-4">הוצאות לפי חודש</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₪${v}`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="סכום" fill="#84a98c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Pie Chart */}
            {pieData.length > 0 && (
              <Card>
                <h2 className="font-semibold text-slate-800 mb-4">פירוט לפי קטגוריה</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>

          {/* Expenses Table */}
          <Card>
            <h2 className="font-semibold text-slate-800 mb-4">הוצאות החודש</h2>
            {expenses.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">אין הוצאות החודש</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((exp, i) => (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center text-sage-700 text-xs font-semibold">
                        {exp.category[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{exp.category}</p>
                        {exp.description && <p className="text-xs text-slate-400">{exp.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {exp.isRecurring && (
                        <RefreshCw size={12} className="text-slate-400" aria-label="קבוע" />
                      )}
                      <p className="text-xs text-slate-400">{formatDate(exp.date)}</p>
                      <p className="text-sm font-semibold text-slate-800 w-20 text-left">{formatCurrency(exp.amount)}</p>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Add Expense Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="הוספת הוצאה">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">סכום</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              className="input"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">קטגוריה</label>
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="input"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">תיאור (אופציונלי)</label>
            <input
              type="text"
              placeholder="לדוגמה: סופר יום ג'"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">תאריך</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className="input"
              required
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => setForm((p) => ({ ...p, isRecurring: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-slate-600">הוצאה קבועה (חוזרת)</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1">הוסף</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">ביטול</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
