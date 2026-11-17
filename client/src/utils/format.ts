export const formatCurrency = (amount: number, currency = '₪') =>
  `${currency}${amount.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export const formatDate = (date: string | Date, opts?: Intl.DateTimeFormatOptions) =>
  new Date(date).toLocaleDateString('he-IL', opts ?? { day: 'numeric', month: 'short', year: 'numeric' })

export const isOverdue = (dueDate?: string | null) =>
  dueDate ? new Date(dueDate) < new Date() : false

export const getDaysUntil = (date: string) => {
  const diff = new Date(date).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export const toISODate = (date: Date) => date.toISOString().split('T')[0]
