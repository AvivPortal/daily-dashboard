import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Toaster } from 'react-hot-toast'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-cream" dir="rtl">
      <Sidebar />
      <main className="flex-1 ml-16 p-6 overflow-y-auto">
        <Outlet />
      </main>
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'glass-card',
          style: { background: '#fff', color: '#1e293b', fontSize: '0.875rem' },
        }}
      />
    </div>
  )
}
