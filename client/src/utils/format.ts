export const formatCurrency = (amount: number, currency = '₪') =>
  `${currency}${amount.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export const formatDate = (date: string | Date, opts?: Intl.DateTimeFormatOptions) =>
  new Date(date).toLocaleDateString('he-IL', opts ?? { day: 'numeric', month: 'short', year: 'numeric' })

export const formatDateTime = (date: string | Date) => {
  const d = new Date(date)
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
  if (!hasTime) return formatDate(d)
  return d.toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const toDateTimeLocal = (date: string | Date) => {
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// datetime-local string ("2026-11-18T01:14") has no timezone — using multi-arg
// constructor guarantees it's treated as local time in ALL browsers
export const dateTimeLocalToISO = (localStr: string): string => {
  const [datePart, timePart] = localStr.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes).toISOString()
}

export const isOverdue = (dueDate?: string | null) =>
  dueDate ? new Date(dueDate) < new Date() : false

export const getDaysUntil = (date: string) => {
  const diff = new Date(date).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export const toISODate = (date: Date) => date.toISOString().split('T')[0]
