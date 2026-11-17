interface BadgeProps {
  label: string
  variant?: 'sage' | 'blue' | 'red' | 'yellow' | 'purple' | 'gray'
}

const VARIANTS = {
  sage: 'bg-sage-100 text-sage-700',
  blue: 'bg-blue-100 text-blue-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-slate-100 text-slate-600',
}

export default function Badge({ label, variant = 'gray' }: BadgeProps) {
  return <span className={`badge ${VARIANTS[variant]}`}>{label}</span>
}
