import { useState } from 'react'
import type { FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiError, Button, Field, Select } from '../../core'
import { driverService } from '../../drivers'
import { vehicleService } from '../../vehicles'
import { zoneService } from '../../zones'
import { useOpenSession } from '../hooks/useCurrentSession'

/**
 * Apertura de la salida: el chofer confirma el vehiculo que tiene asignado, carga el
 * kilometraje y elige la zona.
 *
 * La carga no se declara aca: la subio la oficina antes de que el llegara, y se
 * muestra para que la confirme contra lo que ve arriba del camion. Que la declarara
 * el mismo chofer volvia el control de recepcion una copia de lo que el ya dijo.
 */
export function OpenSessionView() {
  const perfil = useQuery({ queryKey: ['driver', 'me'], queryFn: driverService.getMe })
  const zonas = useQuery({ queryKey: ['zones', 'active'], queryFn: () => zoneService.listActive() })

  const vehicleId = perfil.data?.vehicleId ?? ''
  const carga = useQuery({
    queryKey: ['vehicles', 'load', vehicleId],
    queryFn: () => vehicleService.getPendingLoad(vehicleId),
    enabled: Boolean(vehicleId),
  })

  const abrir = useOpenSession()

  const [zoneId, setZoneId] = useState('')
  const [kilometros, setKilometros] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (perfil.isLoading || zonas.isLoading) {
    return <p className="p-6 text-slate-500">Cargando...</p>
  }

  if (perfil.isError) {
    return <p className="p-6 text-red-600">No se pudo leer tu perfil de chofer.</p>
  }

  const chofer = perfil.data!

  // Sin vehiculo asignado no puede salir, y el backend lo rechaza igual. Mejor
  // decirlo antes de que llene el formulario que despues de mandarlo.
  if (!chofer.vehicleId) {
    return (
      <div className="p-6">
        <p className="text-slate-700">
          No tenés un vehículo asignado. Pedile al admin que te asigne uno antes de salir.
        </p>
      </div>
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      await abrir.mutateAsync({ zoneId, kilometersAtOpen: Number(kilometros) })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.fieldMessages[0] ?? err.detail ?? err.title)
      } else {
        setError('No se pudo conectar con el servidor.')
      }
    }
  }

  const lineas = carga.data ?? []

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-md flex-col gap-5 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Abrir salida</h1>
        <p className="mt-1 text-sm text-slate-600">
          {chofer.firstName} {chofer.lastName} · {chofer.vehicleName} ({chofer.vehicleLicensePlate})
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">Vas a salir con</span>

        {carga.isLoading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : lineas.length === 0 ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            El camión figura vacío. Si tenés mercadería arriba, avisale a la oficina antes de
            salir: lo que no esté cargado acá va a figurar como faltante cuando vuelvas.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {lineas.map((l) => (
              <li
                key={l.id}
                className="flex justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <span className="text-slate-700">{l.productDetail}</span>
                <span className="text-slate-900">{l.quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Select
        label="Zona de reparto"
        name="zoneId"
        required
        value={zoneId}
        onChange={(e) => setZoneId(e.target.value)}
      >
        <option value="">Elegí una zona</option>
        {zonas.data?.items.map((z) => (
          <option key={z.id} value={z.id}>
            {z.name}
          </option>
        ))}
      </Select>

      <Field
        label="Kilometraje del vehículo"
        name="kilometersAtOpen"
        type="number"
        min={0}
        inputMode="numeric"
        required
        value={kilometros}
        onChange={(e) => setKilometros(e.target.value)}
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" disabled={abrir.isPending}>
        {abrir.isPending ? 'Abriendo...' : 'Abrir salida'}
      </Button>
    </form>
  )
}
