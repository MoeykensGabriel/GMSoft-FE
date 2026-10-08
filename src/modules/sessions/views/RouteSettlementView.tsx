import { useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Field, Select, Page, PageHeader } from '../../core'
import { vehicleService } from '../../vehicles'
import { detailedSettlementQuery } from '../hooks/detailedSettlementQuery'
import { SessionSettlementCard } from '../components/SessionSettlementCard'
import { SettlementTotals } from '../components/SettlementTotals'
import { sessionService } from '../services/sessionService'

/**
 * El dia de hoy como YYYY-MM-DD, armado con las partes LOCALES de la fecha.
 *
 * Con toISOString() saldria el dia UTC, que despues de las 21 en Argentina ya es el
 * dia siguiente: la pantalla abriria en la fecha equivocada justo a la hora en que
 * se rinde el reparto.
 */
function hoy(): string {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')

  return `${d.getFullYear()}-${mes}-${dia}`
}

/** El mismo YYYY-MM-DD para leer. Se parte el texto en vez de crear un Date, que
 *  interpretaria la fecha sola como medianoche UTC y mostraria el dia anterior. */
function fechaLegible(iso: string): string {
  const [anio, mes, dia] = iso.split('-')

  return `${dia}/${mes}/${anio}`
}

/**
 * Liquidacion por reparto: se elige el camion y el dia, y sale todo lo demas.
 *
 * Es la pregunta que el admin hace de verdad ("como cerro el reparto de hoy de la
 * Kangoo"), y llegar por ahi es mas corto que buscar la salida en un listado.
 */
export function RouteSettlementView() {
  const [vehicleId, setVehicleId] = useState('')
  const [fecha, setFecha] = useState(hoy)

  const vehiculos = useQuery({
    // Misma clave y misma forma (lista completa) que el resto de las pantallas: la
    // caché es compartida y una forma distinta bajo esta clave rompe a las demás.
    queryKey: ['vehicles', 'all'],
    queryFn: vehicleService.listAll,
  })

  const salidas = useQuery({
    queryKey: ['sessions', 'byVehicle', vehicleId, fecha],
    queryFn: () => sessionService.listByVehicleAndDate(vehicleId, fecha),
    enabled: Boolean(vehicleId && fecha),
    // Una salida que se abre mientras la pantalla está a la vista aparece sola.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  const items = salidas.data?.items ?? []
  // Los totales suman todas las salidas del día; comparten la caché del detalle.
  const detalles = useQueries({ queries: items.map((s) => detailedSettlementQuery(s.id)) })
  const totales = detalles.every((d) => d.isSuccess) ? detalles.flatMap((d) => d.data ?? []) : null

  return (
    <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      <div>
        <PageHeader title={<>Liquidación por reparto</>} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Vehículo"
          name="vehicleId"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
        >
          <option value="">Elegí un vehículo</option>
          {vehiculos.data?.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} ({v.licensePlate})
            </option>
          ))}
        </Select>

        <Field
          label="Fecha"
          name="fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      {!vehicleId ? (
        <p className="text-sm text-muted">
          Elegí un vehículo para ver cómo cerró su reparto.
        </p>
      ) : salidas.isLoading ? (
        <p className="text-sm text-muted">Buscando...</p>
      ) : salidas.isError ? (
        <p className="text-sm text-danger">No se pudieron leer las salidas.</p>
      ) : items.length === 0 ? (
        <p className="ui-card bg-surface p-3 text-sm text-muted">
          Ese vehículo no salió el {fechaLegible(fecha)}.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Casi siempre es una sola, pero nada impide que el mismo camion salga
              dos veces en el dia: se muestran todas y cada una rinde por separado. */}
          {items.length > 1 && (
            <p className="text-sm text-muted">
              {items.length} salidas ese día. Los totales del final las suman a todas.
            </p>
          )}

          {items.map((s) => (
            <SessionSettlementCard key={s.id} session={s} />
          ))}

          {totales && <SettlementTotals settlements={totales} />}
        </div>
      )}
    </Page>
  )
}
