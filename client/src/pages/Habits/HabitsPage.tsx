import { useEffect, useState } from 'react'
import { Plus, Trash2, Flame } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { habitService } from '../../services/habit.service'
import { goalService } from '../../services/goal.service'
import type { Habit, Goal } from '../../types'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import { toISODate } from '../../utils/format'

const ICONS = ['target', 'dumbbell', 'book', 'droplets', 'bed', 'utensils', 'heart', 'brain', 'music', 'code']
const COLORS = ['#84a98c', '#6b9e78', '#5b6fa8', '#8f6bab', '#c06b6b', '#c8955c', '#5b9fb5', '#c8c45c']

function computeStreak(logs: { date: string; completed: boolean }[]): number {
  const dates = logs
    .filter((l) => l.completed)
    .map((l) => toISODate(new Date(l.date)))
    .sort()
    .reverse()

  if (!dates.length) return 0
  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)

  for (const dateStr of dates) {
    const d = new Date(dateStr)
    const diff = Math.round((current.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 1) {
      streak++
      current = d
    } else {
      break
    }
  }
  return streak
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [habitModal, setHabitModal] = useState(false)
  const [goalModal, setGoalModal] = useState(false)
  const [habitForm, setHabitForm] = useState({ name: '', description: '', color: COLORS[0], icon: ICONS[0] })
  const [goalForm, setGoalForm] = useState({ title: '', targetValue: '', currentValue: '', unit: '', deadline: '', category: '' })
  const [loading, setLoading] = useState(true)
  const today = toISODate(new Date())

  const load = async () => {
    setLoading(true)
    const [h, g] = await Promise.all([habitService.getAll(), goalService.getAll()])
    setHabits(h)
    setGoals(g)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleHabit = async (habitId: string) => {
    const result = await habitService.toggleLog(habitId, today)
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h
        const logs = result.completed
          ? [...h.logs, { id: 'tmp', habitId, date: today, completed: true }]
          : h.logs.filter((l) => toISODate(new Date(l.date)) !== today)
        return { ...h, logs }
      }),
    )
  }

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const created = await habitService.create({ ...habitForm, frequency: 'DAILY' })
      setHabits((p) => [...p, created])
      setHabitModal(false)
      setHabitForm({ name: '', description: '', color: COLORS[0], icon: ICONS[0] })
      toast.success('הרגל נוסף')
    } catch { toast.error('שגיאה') }
  }

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const created = await goalService.create({
        title: goalForm.title,
        targetValue: parseFloat(goalForm.targetValue),
        currentValue: goalForm.currentValue ? parseFloat(goalForm.currentValue) : 0,
        unit: goalForm.unit,
        deadline: goalForm.deadline || undefined,
        category: goalForm.category || undefined,
      })
      setGoals((p) => [...p, created])
      setGoalModal(false)
      setGoalForm({ title: '', targetValue: '', currentValue: '', unit: '', deadline: '', category: '' })
      toast.success('מטרה נוספה')
    } catch { toast.error('שגיאה') }
  }

  const handleDeleteHabit = async (id: string) => {
    await habitService.delete(id)
    setHabits((p) => p.filter((h) => h.id !== id))
    toast.success('הרגל נמחק')
  }

  const handleDeleteGoal = async (id: string) => {
    await goalService.delete(id)
    setGoals((p) => p.filter((g) => g.id !== id))
    toast.success('מטרה נמחקה')
  }

  const updateGoalProgress = async (id: string, currentValue: number) => {
    const updated = await goalService.update(id, { currentValue })
    setGoals((p) => p.map((g) => g.id === id ? updated : g))
  }

  const doneToday = habits.filter((h) => h.logs.some((l) => toISODate(new Date(l.date)) === today)).length

  return (
    <div>
      <PageHeader
        title="הרגלים ומטרות"
        subtitle={`${doneToday}/${habits.length} הרגלים היום`}
        action={
          <div className="flex gap-2">
            <button onClick={() => setGoalModal(true)} className="btn-ghost flex items-center gap-2">
              <Plus size={16} /> מטרה
            </button>
            <button onClick={() => setHabitModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> הרגל
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Habits */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-600 mb-3">הרגלים יומיים</h2>
            {habits.length === 0 ? (
              <Card>
                <p className="text-sm text-slate-400 text-center py-4">אין הרגלים עדיין. הוסף הרגל ראשון!</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {habits.map((habit, i) => {
                  const done = habit.logs.some((l) => toISODate(new Date(l.date)) === today)
                  const streak = computeStreak(habit.logs)
                  return (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Card className={`flex items-center gap-4 ${done ? 'opacity-80' : ''}`}>
                        <button
                          onClick={() => toggleHabit(habit.id)}
                          className="flex-shrink-0 w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center"
                          style={{
                            borderColor: habit.color,
                            background: done ? habit.color : 'transparent',
                          }}
                        >
                          {done && <span className="text-white text-sm">✓</span>}
                        </button>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                            {habit.name}
                          </p>
                          {habit.description && <p className="text-xs text-slate-400">{habit.description}</p>}
                        </div>
                        {streak > 0 && (
                          <div className="flex items-center gap-1 text-amber-500">
                            <Flame size={14} />
                            <span className="text-xs font-medium">{streak}</span>
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="text-slate-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Goals */}
          <div>
            <h2 className="text-sm font-semibold text-slate-600 mb-3">מטרות</h2>
            {goals.length === 0 ? (
              <Card>
                <p className="text-sm text-slate-400 text-center py-4">אין מטרות עדיין</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {goals.map((goal, i) => {
                  const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{goal.title}</p>
                            {goal.category && <p className="text-xs text-slate-400">{goal.category}</p>}
                          </div>
                          <button onClick={() => handleDeleteGoal(goal.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="number"
                            value={goal.currentValue}
                            onChange={(e) => updateGoalProgress(goal.id, parseFloat(e.target.value))}
                            className="w-20 input text-center text-sm"
                            min={0}
                            max={goal.targetValue}
                          />
                          <span className="text-xs text-slate-400">/ {goal.targetValue} {goal.unit}</span>
                          <span className="text-xs font-semibold text-sage-600 mr-auto">{pct}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full bg-sage-500"
                          />
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Habit Modal */}
      <Modal open={habitModal} onClose={() => setHabitModal(false)} title="הרגל חדש">
        <form onSubmit={handleAddHabit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">שם הרגל</label>
            <input type="text" value={habitForm.name} onChange={(e) => setHabitForm((p) => ({ ...p, name: e.target.value }))} className="input" required />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">תיאור</label>
            <input type="text" value={habitForm.description} onChange={(e) => setHabitForm((p) => ({ ...p, description: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">צבע</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setHabitForm((p) => ({ ...p, color: c }))}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${habitForm.color === c ? 'scale-125 border-slate-400' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1">הוסף</button>
            <button type="button" onClick={() => setHabitModal(false)} className="btn-ghost flex-1">ביטול</button>
          </div>
        </form>
      </Modal>

      {/* Add Goal Modal */}
      <Modal open={goalModal} onClose={() => setGoalModal(false)} title="מטרה חדשה">
        <form onSubmit={handleAddGoal} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">כותרת</label>
            <input type="text" value={goalForm.title} onChange={(e) => setGoalForm((p) => ({ ...p, title: e.target.value }))} className="input" required />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">ערך נוכחי</label>
              <input type="number" value={goalForm.currentValue} onChange={(e) => setGoalForm((p) => ({ ...p, currentValue: e.target.value }))} className="input" placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">יעד</label>
              <input type="number" value={goalForm.targetValue} onChange={(e) => setGoalForm((p) => ({ ...p, targetValue: e.target.value }))} className="input" required />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">יחידה</label>
              <input type="text" value={goalForm.unit} onChange={(e) => setGoalForm((p) => ({ ...p, unit: e.target.value }))} className="input" placeholder="קג, שעות..." required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">קטגוריה</label>
              <input type="text" value={goalForm.category} onChange={(e) => setGoalForm((p) => ({ ...p, category: e.target.value }))} className="input" placeholder="כושר, כסף..." />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">דדליין</label>
              <input type="date" value={goalForm.deadline} onChange={(e) => setGoalForm((p) => ({ ...p, deadline: e.target.value }))} className="input" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1">הוסף</button>
            <button type="button" onClick={() => setGoalModal(false)} className="btn-ghost flex-1">ביטול</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
