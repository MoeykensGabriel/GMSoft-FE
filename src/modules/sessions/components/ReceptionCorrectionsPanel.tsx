import { useQuery } from '@tanstack/react-query'
import { BUSINESS_TIME_ZONE, formatDateTime, Panel } from '../../core'
import { receptionQuery } from '../hooks/receptionQuery'
import { correctionChanges } from '../utils/receptionChanges'

/**
 * Lo que la oficina corrigió de la recepción después de cerrarla. Queda a la vista en
 * la salida: un número que cambió sin dejar rastro es justo lo que no tiene que pasar.
 */
export function ReceptionCorrectionsPanel({ sessionId }: { sessionId: string }) {
  const recepcion = useQuery(receptionQuery(sessionId))
  const correcciones = recepcion.data?.corrections ?? []
  if (correcciones.length === 0) return null

  return (
    <Panel title={`Correcciones de la recepción (${correcciones.length})`}>
      <ol className="flex flex-col gap-3">
        {[...correcciones].reverse().map((c) => (
          <li key={c.id} className="rounded border border-line bg-surface px-4 py-3">
            <p className="text-sm text-muted">
              {formatDateTime(c.correctedAt, BUSINESS_TIME_ZONE)}
              {c.correctedByUserName && <> · {c.correctedByUserName}</>}
            </p>
            <p className="mt-1 text-base text-ink">Motivo: «{c.reason}»</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-ink">
              {correctionChanges(c).map((cambio) => <li key={cambio}>{cambio}</li>)}
            </ul>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
