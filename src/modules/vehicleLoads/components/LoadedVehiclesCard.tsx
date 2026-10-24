import { useQueries, useQuery } from '@tanstack/react-query'
import { Button, ErrorMessage, LinkButton, Panel, weekdayLabels } from '../../core'
import { driverService } from '../../drivers'
import { vehicleService } from '../../vehicles'

/**
 * Home: los camiones que ya tienen carga arriba y todavía no salieron. Desde acá se ve
 * la carga o se abre la salida, sin pasar por Salidas y recepción.
 */
export function LoadedVehiclesCard() {
  const estado = useQuery({ queryKey: ['vehicles', 'load-status'], queryFn: vehicleService.getLoadStatus, refetchInterval: 60_000 })
  const choferes = useQuery({ queryKey: ['drivers', 'active'], queryFn: driverService.listActive })
  const cargados = (estado.data ?? []).filter((v) => !v.isOnRoute && v.pendingUnits > 0)
  // Lo que lleva cada uno, sumado por producto aunque se haya cargado en tandas.
  const cargas = useQueries({ queries: cargados.map((v) => ({
    queryKey: ['vehicles', 'load-summary', v.id], queryFn: () => vehicleService.getPendingLoadSummary(v.id),
  })) })

  if (estado.isPending || (estado.isSuccess && !cargados.length)) return null
  return <Panel title={`Camiones cargados, esperando salir (${cargados.length})`}
    actions={<Button variant="secondary" disabled={estado.isFetching} onClick={() => void estado.refetch()}>{estado.isFetching ? 'Actualizando…' : 'Actualizar'}</Button>}>
    <ErrorMessage error={estado.error ?? choferes.error} />
    <ul className="flex flex-col gap-3">{cargados.map((v, i) => {
      const resumen = cargas[i]?.data
      const suyos = (choferes.data ?? []).filter((c) => c.vehicleId === v.id)
      // Con un solo chofer, la salida se abre ya con él elegido.
      const abrir = suyos.length === 1 ? `/panel/salidas/abrir?chofer=${suyos[0].id}` : '/panel/salidas/abrir'
      // Listo para salir: cargado y con chofer. Sin chofer queda marcado en naranja.
      const listo = suyos.length > 0
      return <li key={v.id} className={`flex flex-wrap items-center justify-between gap-3 rounded border-2 p-4 ${listo ? 'border-success bg-success-soft' : 'border-warning bg-warning-soft'}`}>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-lg font-semibold">{v.name} · {v.licensePlate}
            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${listo ? 'bg-success-light text-black' : 'bg-warning-soft text-warning'}`}>{listo ? 'Listo para salir' : 'Falta chofer'}</span></p>
          <p className="text-sm">Chofer: <strong>{suyos.length ? suyos.map((c) => `${c.firstName} ${c.lastName}`).join(', ') : 'sin chofer asignado'}</strong>
            {resumen?.routeDays.length ? <> · Días: <strong>{weekdayLabels(resumen.routeDays)}</strong></> : null}</p>
          <p className="text-sm text-muted">
            {resumen ? resumen.lines.map((l) => `${l.productDetail}: ${l.quantity}`).join(' · ') : 'Cargando…'} · <strong className="text-ink">{v.pendingUnits} unidades</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton to={`/panel/carga?vehiculo=${v.id}`} aria-label={`Ver la carga de ${v.name} ${v.licensePlate}`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
            </svg>
            Ver
          </LinkButton>
          {suyos.length > 0 && <LinkButton to={abrir} variant="primary" aria-label={`Abrir salida de ${v.name} ${v.licensePlate}`}>Abrir salida</LinkButton>}
        </div>
      </li>
    })}</ul>
  </Panel>
}
