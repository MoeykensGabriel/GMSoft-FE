import type { ReactNode } from 'react'
import { useCurrentSession } from '../hooks/useCurrentSession'
import { CurrentSessionView } from './CurrentSessionView'
import { OpenSessionView } from './OpenSessionView'

/**
 * Puerta de entrada del chofer. Con una salida abierta muestra la salida; si no,
 * el formulario para abrirla. Es una sola ruta porque para el chofer es un solo
 * lugar: "lo mio de hoy".
 */
export function DeliveryRouteView({ promotions }: { promotions?: ReactNode }) {
  const { data: sesion, isLoading, isError } = useCurrentSession()

  if (isLoading) return <p className="p-6 text-muted">Cargando...</p>
  if (isError && !sesion) return <p className="p-6 text-danger">No se pudo leer tu salida.</p>

  return sesion ? <CurrentSessionView sesion={sesion} promotions={promotions} /> : <OpenSessionView />
}
