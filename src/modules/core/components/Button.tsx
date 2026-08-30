import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primary' | 'secondary'

const ESTILOS: Record<Variante, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700 disabled:bg-slate-400',
  secondary: 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variante
}

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return (
    <button
      {...props}
      className={`rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${ESTILOS[variant]} ${className}`}
    />
  )
}
