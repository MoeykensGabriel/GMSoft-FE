import { Link } from 'react-router-dom'
import { useAlertCount } from './useAlertCount'

/** Lleva a la página de alertas, en el menú y en el Home. Sin alertas no aparece. */
export function AlertsButton({ className = '', onClick }: { className?: string; onClick?: () => void }) {
  const { activas } = useAlertCount()
  if (!activas) return null
  return <Link to="/panel/alertas" onClick={onClick}
    className={`flex min-h-11 items-center rounded border border-warning/40 bg-warning-soft px-3 py-2 text-sm font-semibold text-warning hover:bg-warning/10 ${className}`}>
    Alertas ({activas})
  </Link>
}
