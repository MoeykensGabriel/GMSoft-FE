import { Link } from 'react-router-dom'
import type { To } from 'react-router-dom'
import { actionStyles } from './actionStyles'
import type { ActionVariant } from './actionStyles'

interface Props {
  /** El texto completo, por ejemplo «Volver a Clientes». */
  label: string
  /** A dónde vuelve. Sin `to`, es un botón que ejecuta `onClick` (volver dentro de la misma pantalla). */
  to?: To
  onClick?: () => void
  /** `button`: con borde, para tocar fácil en el celular. `link`: liviano, para cabeceras del panel. */
  appearance?: 'button' | 'link'
  variant?: ActionVariant
  className?: string
}

/** La flecha dibujada: igual en todos los celulares y el lector de pantalla no la lee. */
function BackIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M12.5 4.5L7 10l5.5 5.5" />
    </svg>
  )
}

/**
 * Volver a la pantalla anterior. Un solo componente para que todos los «volver» tengan el
 * mismo ícono, texto y alto de toque (44 px); cada pantalla elige a dónde, el texto y si se ve
 * como botón o como link.
 */
export function BackButton({ label, to, onClick, appearance = 'button', variant = 'secondary', className = '' }: Props) {
  const classes = appearance === 'link'
    ? `inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium text-muted hover:text-brand hover:underline ${className}`
    : actionStyles(variant, `min-h-11 self-start ${className}`)
  const content = <><BackIcon /><span>{label}</span></>
  return to !== undefined
    ? <Link to={to} className={classes}>{content}</Link>
    : <button type="button" onClick={onClick} className={classes}>{content}</button>
}
