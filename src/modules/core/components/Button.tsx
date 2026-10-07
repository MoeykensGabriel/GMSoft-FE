import type { ButtonHTMLAttributes } from 'react'
import { actionStyles } from './actionStyles'
import type { ActionVariant } from './actionStyles'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionVariant
}

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return (
    <button
      {...props}
      className={actionStyles(variant, className)}
    />
  )
}
