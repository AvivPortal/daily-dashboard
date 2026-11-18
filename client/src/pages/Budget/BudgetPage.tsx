import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, RefreshCw, Check, X, Edit2, Settings } from 'lucide-react'
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

const DEFAULT_CATEGORIES = [
  'שכר דירה', 'גן / חינוך', 'מזון', 'מסעדות', 'תחבורה',
  'בריאות', 'בידור', 'קניות', 'חשבונות', 'אחר',
]

const MONTH_NAMES = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ']
const PIE_COLORS = ['#84a98c', '#6b9e78', '#52917e', '#3a8484', '#5b6fa8', '#8f6bab', '#c06b6b', '#c8955c', '#c8c45c', '#7d7d7d']

const loadCategories = (): string[] => {
  try { return JSON.parse(localStorage.getItem('budget_categories') || 'null') ?? [...DEFAULT_CATEGORIES] } catch { return [...DEFAULT_CATEGORIES] }
}
const saveCategories = (cats: string[]) => {
  try { localStorage.setItem('budget_categories', JSON.stringify(cats)) } catch { /* noop */ }
}

const emptyForm = { amount: '', description: '', date: new Date().toISOString().split('T')[0], isRecurring: false }

export default function BudgetPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [open, setOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0])
  const [loading, setLoading] = useState(true)

  const [categories, setCategories] = useState<string[]>(loadCategories)
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCatInput, setNewCatInput] = useState('')
  const newCatRef = useRef<HTMLInputElement>(null)

  const [managingCategories, setManagingCategories] = useState(false)
  const [renamingCat, setRenamingCat] = useState<string | null>(null)
  const [renameInput, setRenameInput] = useState('')

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

  const openCreate = () => {
    setEditExpense(null)
    setForm(emptyForm)
    setCategory(categories[0] ?? DEFAULT_CATEGORIES[0])
    setAddingCategory(false)
    setManagingCategories(false)
    setOpen(true)
  }

  const openEdit = (exp: Expense) => {
    setEditExpense(exp)
    setForm({ amount: String(exp.amount), description: exp.description ?? '', date: exp.date.split('T')[0], isRecurring: exp.isRecurring })
    setCategory(exp.category)
    setAddingCategory(false)
    setManagingCategories(false)
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    setAddingCategory(false)
    setNewCatInput('')
    setManagingCategories(false)
    setRenamingCat(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        amount: parseFloat(form.amount),
        category,
        description: form.description || undefined,
        date: form.date,
        isRecurring: form.isRecurring,
      }
      if (editExpense) {
        const updated = await expenseService.update(editExpense.id, payload)
        setExpenses((p) => p.map((x) => x.id === updated.id ? updated : x))
        const diff = updated.amount - editExpense.amount
        setSummary((s) => s ? { ...s, totalThisMonth: s.totalThisMonth + diff } : s)
        toast.success('הוצאה עודכנה')
      } else {
        const exp = await expenseService.create(payload)
        setExpenses((p) => [exp, ...p])
        setSummary((s) => s ? { ...s, totalThisMonth: s.totalThisMonth + exp.amount } : s)
        toast.success('הוצאה נוספה')
      }
      closeModal()
    } catch {
      toast.error(editExpense ? 'שגיאה בעדכון הוצאה' : 'שגיאה בהוספת הוצאה')
    }
  }

  const handleDelete = async (id: string) => {
    const exp = expenses.find((e) => e.id === id)
    await expenseService.delete(id)
    setExpenses((p) => p.filter((e) => e.id !== id))
    if (exp) setSummary((s) => s ? { ...s, totalThisMonth: s.totalThisMonth - exp.amount } : s)
    toast.success('הוצאה נמחקה')
  }

  const confirmNewCategory = () => {
    const name = newCatInput.trim()
    if (!name || categories.includes(name)) return
    const updated = [...categories, name]
    setCategories(updated)
    saveCategories(updated)
    setCategory(name)
    setAddingCategory(false)
    setNewCatInput('')
  }

  const deleteCategory = (cat: string) => {
    const updated = categories.filter((c) => c !== cat)
    setCategories(updated)
    saveCategories(updated)
    if (category === cat) setCategory(updated[0] ?? '')
  }

  const startRename = (cat: string) => {
    setRenamingCat(cat)
    setRenameInput(cat)
  }

  const confirmRename = () => {
    if (!renamingCat) return
    const name = renameInput.trim()
    if (!name || (name !== renamingCat && categories.includes(name))) return
    const updated = categories.map((c) => c === renamingCat ? name : c)
    setCategories(updated)
    saveCategories(updated)
    if (category === renamingCat) setCategory(name)
    setRenamingCat(null)
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
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
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
                        onClick={() => openEdit(exp)}
                        className="text-slate-300 hover:text-sage-500 transition-colors"
                        title="ערוך"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors"
                        title="מחק"
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

      <Modal open={open} onClose={closeModal} title={editExpense ? 'עריכת הוצאה' : 'הוספת הוצאה'}>
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-500">קטגוריה</label>
              <button
                type="button"
                onClick={() => { setManagingCategories((v) => !v); setRenamingCat(null) }}
                className={`p-1 rounded transition-colors ${managingCategories ? 'text-sage-600 bg-sage-50' : 'text-slate-400 hover:text-slate-600'}`}
                title="ניהול קטגוריות"
              >
                <Settings size={13} />
              </button>
            </div>

            {managingCategories ? (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center gap-2 px-3 py-2">
                    {renamingCat === cat ? (
                      <>
                        <input
                          autoFocus
                          type="text"
                          value={renameInput}
                          onChange={(e) => setRenameInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmRename() } if (e.key === 'Escape') setRenamingCat(null) }}
                          className="input py-0.5 text-sm flex-1"
                        />
                        <button type="button" onClick={confirmRename} className="p-1 rounded bg-sage-500 text-white hover:bg-sage-600 transition-colors flex-shrink-0">
                          <Check size={12} />
                        </button>
                        <button type="button" onClick={() => setRenamingCat(null)} className="p-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors flex-shrink-0">
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-slate-700 flex-1 truncate">{cat}</span>
                        <button type="button" onClick={() => startRename(cat)} className="p-1 rounded text-slate-400 hover:text-sage-600 hover:bg-sage-50 transition-colors flex-shrink-0" title="שנה שם">
                          <Edit2 size={12} />
                        </button>
                        <button type="button" onClick={() => deleteCategory(cat)} className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0" title="מחק קטגוריה">
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
                <div
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-sage-50 transition-colors"
                  onClick={() => { setManagingCategories(false); setAddingCategory(true); setTimeout(() => newCatRef.current?.focus(), 50) }}
                >
                  <Plus size={12} className="text-sage-500" />
                  <span className="text-sm text-sage-600">הוסף קטגוריה</span>
                </div>
              </div>
            ) : !addingCategory ? (
              <select
                value={category}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    setAddingCategory(true)
                    setTimeout(() => newCatRef.current?.focus(), 50)
                  } else {
                    setCategory(e.target.value)
                  }
                }}
                className="input"
              >
                {categories.map((c) => <option key={c}>{c}</option>)}
                <option value="__new__">+ קטגוריה חדשה...</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  ref={newCatRef}
                  type="text"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmNewCategory() } if (e.key === 'Escape') { setAddingCategory(false); setNewCatInput('') } }}
                  placeholder="שם קטגוריה חדשה"
                  className="input flex-1"
                />
                <button type="button" onClick={confirmNewCategory} className="p-2 rounded-lg bg-sage-500 text-white hover:bg-sage-600 transition-colors">
                  <Check size={16} />
                </button>
                <button type="button" onClick={() => { setAddingCategory(false); setNewCatInput('') }} className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}
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
            <button type="submit" className="btn-primary flex-1">{editExpense ? 'עדכן' : 'הוסף'}</button>
            <button type="button" onClick={closeModal} className="btn-ghost flex-1">ביטול</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
