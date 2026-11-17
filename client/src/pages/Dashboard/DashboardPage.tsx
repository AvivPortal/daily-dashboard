import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, CheckSquare, Briefcase, Target, TrendingUp, Calendar } from 'lucide-react'
import { dashboardService } from '../../services/dashboard.service'
import type { DashboardSummary } from '../../types'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import { formatCurrency, formatDate } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-slate-100 text-slate-600',
}

const JOB_STATUS_LABEL: Record<string, string> = {
  APPLIED: 'הגשה',
  SCREENING: 'סינון',
  INTERVIEW: 'ראיון',
  OFFER: 'הצעה',
  REJECTED: 'דחייה',
  GHOSTED: 'שתיקה',
}

const JOB_STATUS_COLOR: Record<string, string> = {
  APPLIED: 'bg-blue-100 text-blue-700',
  SCREENING: 'bg-purple-100 text-purple-700',
  INTERVIEW: 'bg-amber-100 text-amber-700',
  OFFER: 'bg-sage-100 text-sage-700',
  REJECTED: 'bg-red-100 text-red-700',
  GHOSTED: 'bg-slate-100 text-slate-500',
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    dashboardService.getSummary().then(setData).finally(() => setLoading(false))
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'בוקר טוב'
    if (h < 17) return 'צהריים טובים'
    return 'ערב טוב'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const kpis = data?.kpis

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(' ')[0] ?? ''} 👋`}
        subtitle={formatDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            icon: Wallet,
            label: 'הוצאות החודש',
            value: formatCurrency(kpis?.totalExpensesThisMonth ?? 0),
            color: 'text-blue-500',
            bg: 'bg-blue-50',
          },
          {
            icon: CheckSquare,
            label: 'משימות הושלמו',
            value: String(kpis?.tasksDone ?? 0),
            color: 'text-sage-500',
            bg: 'bg-sage-100',
          },
          {
            icon: Briefcase,
            label: 'הגשות עבודה',
            value: String(kpis?.jobsApplied ?? 0),
            color: 'text-purple-500',
            bg: 'bg-purple-50',
          },
          {
            icon: Target,
            label: 'הרגלים היום',
            value: `${kpis?.habitsDoneToday ?? 0}/${kpis?.habitsTotal ?? 0}`,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card hover>
              <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
                <kpi.icon size={20} className={kpi.color} />
              </div>
              <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
              <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Recent Expenses */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-sage-500" />
            <h2 className="font-semibold text-slate-800">הוצאות אחרונות</h2>
          </div>
          {!data?.recentExpenses?.length ? (
            <p className="text-sm text-slate-400">אין הוצאות עדיין</p>
          ) : (
            <div className="space-y-3">
              {data.recentExpenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{exp.category}</p>
                    {exp.description && (
                      <p className="text-xs text-slate-400">{exp.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">{formatCurrency(exp.amount)}</p>
                    <p className="text-xs text-slate-400">{formatDate(exp.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-sage-500" />
            <h2 className="font-semibold text-slate-800">משימות קרובות</h2>
          </div>
          {!data?.upcomingTasks?.length ? (
            <p className="text-sm text-slate-400">אין משימות עם תאריך יעד</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-sage-500 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-xs text-slate-400">{formatDate(task.dueDate)}</p>
                    )}
                  </div>
                  <span className={`badge text-xs ${PRIORITY_COLOR[task.priority]}`}>
                    {task.priority === 'HIGH' ? 'גבוה' : task.priority === 'MEDIUM' ? 'בינוני' : 'נמוך'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Job Pipeline */}
      {!!data?.jobPipeline?.length && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={18} className="text-sage-500" />
            <h2 className="font-semibold text-slate-800">Pipeline משרות</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.jobPipeline.map((p) => (
              <div key={p.status} className={`badge ${JOB_STATUS_COLOR[p.status]} px-3 py-1`}>
                {JOB_STATUS_LABEL[p.status]}: {p._count}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
