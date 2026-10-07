import { Link } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'
import { actionStyles } from './actionStyles'
import type { ActionVariant } from './actionStyles'

export function LinkButton({ variant = 'secondary', className = '', ...props }: LinkProps & { variant?: ActionVariant }) {
  return <Link {...props} className={actionStyles(variant, className)} />
}
