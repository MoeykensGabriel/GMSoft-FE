import { useState } from 'react'
import type { FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiError, Button, Field, Select } from '../../core'
import { driverService } from '../../drivers'
import { productService } from '../../products'
import { zoneService } from '../../zones'
import { LoadEditor } from '../components/LoadEditor'
import type { LoadLine } from '../components/LoadEditor'
import { useOpenSession } from '../hooks/useCurrentSession'

/**
 * Apertura de la salida: el chofer confirma el vehiculo que tiene asignado, carga el
 * kilometraje, elige la zona y declara lo que sube al camion.
 */
export function OpenSessionView() {
  const perfil = useQuery({ queryKey: ['driver', 'me'], queryFn: driverService.getMe })
  const zonas = useQuery({ queryKey: ['zones', 'active'], queryFn: () => zoneService.listActive() })
  const productos = useQuery({
    queryKey: ['products', 'published'],
    queryFn: () => productService.listPublished(),
  })

  const abrir = useOpenSession()

  const [zoneId, setZoneId] = useState('')
  const [kilometros, setKilometros] = useState('')
  const [carga, setCarga] = useState<LoadLine[]>([])
  const [error, setError] = useState<string | null>(null)

  if (perfil.isLoading || zonas.isLoading || productos.isLoading) {
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
      await abrir.mutateAsync({
        zoneId,
        kilometersAtOpen: Number(kilometros),
        load: carga,
      })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.fieldMessages[0] ?? err.detail ?? err.title)
      } else {
        setError('No se pudo conectar con el servidor.')
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-md flex-col gap-5 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Abrir salida</h1>
        <p className="mt-1 text-sm text-slate-600">
          {chofer.firstName} {chofer.lastName} · {chofer.vehicleName} ({chofer.vehicleLicensePlate})
        </p>
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

      <LoadEditor productos={productos.data?.items ?? []} valor={carga} onChange={setCarga} />

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
