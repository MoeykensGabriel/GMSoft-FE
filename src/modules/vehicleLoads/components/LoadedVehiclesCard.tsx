import { useQuery } from '@tanstack/react-query'
import { Button, ErrorMessage, LinkButton, Panel } from '../../core'
import { driverService } from '../../drivers'
import { vehicleService } from '../../vehicles'

/**
 * Home: los camiones que ya tienen carga arriba y todavía no salieron, con cuánto llevan.
 * En verde los listos para salir; sin chofer asignado, en naranja. Desde acá se ve la
 * carga o se abre la salida.
 */
export function LoadedVehiclesCard() {
  const estado = useQuery({ queryKey: ['vehicles', 'load-status'], queryFn: vehicleService.getLoadStatus, refetchInterval: 60_000 })
  const choferes = useQuery({ queryKey: ['drivers', 'active'], queryFn: driverService.listActive })
  const cargados = (estado.data ?? []).filter((v) => !v.isOnRoute && v.pendingUnits > 0)

  if (estado.isPending || (estado.isSuccess && !cargados.length)) return null
  return <Panel title={`Listos para salir (${cargados.length})`}
    actions={<Button variant="secondary" disabled={estado.isFetching} onClick={() => void estado.refetch()}>{estado.isFetching ? 'Actualizando…' : 'Actualizar'}</Button>}>
    <ErrorMessage error={estado.error ?? choferes.error} />
    <ul className="flex flex-col gap-3">{cargados.map((v) => {
      const suyos = (choferes.data ?? []).filter((c) => c.vehicleId === v.id)
      const listo = suyos.length > 0
      // Con un solo chofer, la salida se abre ya con él elegido.
      const abrir = suyos.length === 1 ? `/panel/salidas/abrir?chofer=${suyos[0].id}` : '/panel/salidas/abrir'
      return <li key={v.id} className={`flex flex-wrap items-center justify-between gap-3 rounded border-2 px-4 py-3 ${listo ? 'border-success bg-success-soft' : 'border-warning bg-warning-soft'}`}>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-lg font-semibold">{v.name} · {v.licensePlate}</span>
          <span className="text-lg">{v.pendingUnits} unidades</span>
          {!listo && <span className="text-sm font-semibold text-warning">Falta chofer</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          <LinkButton to={`/panel/carga?vehiculo=${v.id}`} aria-label={`Ver la carga de ${v.name} ${v.licensePlate}`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
            </svg>
            Ver
          </LinkButton>
          {listo && <LinkButton to={abrir} variant="primary" aria-label={`Abrir salida de ${v.name} ${v.licensePlate}`}>Abrir salida</LinkButton>}
        </div>
      </li>
    })}</ul>
  </Panel>
}
