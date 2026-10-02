import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primary' | 'secondary' | 'danger'

const ESTILOS: Record<Variante, string> = {
  primary: 'bg-green-700 text-white hover:bg-green-800 disabled:bg-neutral-400',
  secondary: 'bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50',
  danger: 'bg-red-700 text-white hover:bg-red-800 disabled:bg-neutral-400',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variante
}

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return (
    <button
      {...props}
      className={`min-h-11 rounded-md px-4 py-2 text-base font-medium disabled:cursor-not-allowed ${ESTILOS[variant]} ${className}`}
    />
  )
}
