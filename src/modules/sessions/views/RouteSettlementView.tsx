import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Field, Select } from '../../core'
import { vehicleService } from '../../vehicles'
import { SessionSettlementCard } from '../components/SessionSettlementCard'
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
    queryKey: ['vehicles', 'all'],
    queryFn: () => vehicleService.list(),
  })

  const salidas = useQuery({
    queryKey: ['sessions', 'byVehicle', vehicleId, fecha],
    queryFn: () => sessionService.listByVehicleAndDate(vehicleId, fecha),
    enabled: Boolean(vehicleId && fecha),
  })

  const items = salidas.data?.items ?? []

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-5 p-6">
      <div>
        <Link to="/" className="text-sm text-slate-500 hover:underline">
          ← Panel
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Liquidación por reparto</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Vehículo"
          name="vehicleId"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
        >
          <option value="">Elegí un vehículo</option>
          {vehiculos.data?.items.map((v) => (
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
        <p className="text-sm text-slate-500">
          Elegí un vehículo para ver cómo cerró su reparto.
        </p>
      ) : salidas.isLoading ? (
        <p className="text-sm text-slate-500">Buscando...</p>
      ) : salidas.isError ? (
        <p className="text-sm text-red-600">No se pudieron leer las salidas.</p>
      ) : items.length === 0 ? (
        <p className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600">
          Ese vehículo no salió el {fechaLegible(fecha)}.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Casi siempre es una sola, pero nada impide que el mismo camion salga
              dos veces en el dia: se muestran todas y cada una rinde por separado. */}
          {items.length > 1 && (
            <p className="text-sm text-slate-600">
              {items.length} salidas ese día. Cada una se rinde por separado.
            </p>
          )}

          {items.map((s) => (
            <SessionSettlementCard key={s.id} sessionId={s.id} />
          ))}
        </div>
      )}
    </main>
  )
}
