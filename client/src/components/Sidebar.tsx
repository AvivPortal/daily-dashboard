import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Wallet,
  CheckSquare,
  Briefcase,
  Target,
  FileText,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/budget', icon: Wallet, label: 'תקציב' },
  { to: '/tasks', icon: CheckSquare, label: 'משימות' },
  { to: '/jobs', icon: Briefcase, label: 'משרות' },
  { to: '/habits', icon: Target, label: 'הרגלים' },
  { to: '/notes', icon: FileText, label: 'פתקים' },
]

export default function Sidebar() {
  const { logout, user } = useAuth()

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-sidebar flex flex-col items-center py-6 gap-2 z-50">
      <div className="mb-4">
        <div className="w-8 h-8 rounded-lg bg-sage-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">D</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={label}
            className={({ isActive }) =>
              `group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                isActive
                  ? 'bg-sage-500 text-white'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} />
                <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                  {label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 rounded-xl bg-sage-500 -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col items-center gap-3 mt-auto">
        <div
          className="w-8 h-8 rounded-full bg-sage-500/20 flex items-center justify-center cursor-pointer"
          title={user?.name}
        >
          <span className="text-sage-500 font-semibold text-sm">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </span>
        </div>
        <button
          onClick={logout}
          title="התנתק"
          className="text-slate-500 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
