import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/Auth/LoginPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import BudgetPage from './pages/Budget/BudgetPage'
import TasksPage from './pages/Tasks/TasksPage'
import JobsPage from './pages/Jobs/JobsPage'
import HabitsPage from './pages/Habits/HabitsPage'
import NotesPage from './pages/Notes/NotesPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="budget" element={<BudgetPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="habits" element={<HabitsPage />} />
            <Route path="notes" element={<NotesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
