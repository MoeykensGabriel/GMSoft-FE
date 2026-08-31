import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, ErrorMessage, Select, formatDateTime } from '../../core'
import { productService } from '../../products'
import { LoadEditor } from '../components/LoadEditor'
import type { LoadLine } from '../components/LoadEditor'
import { vehicleService } from '../services/vehicleService'

/**
 * Cargar el camion, de manana, antes de que salga el chofer.
 *
 * Lo que se sube queda esperando sin dueno hasta que alguien abre una salida con ese
 * vehiculo: ahi se convierte en la carga inicial de esa salida. Por eso se puede
 * cargar sin saber todavia que chofer lo va a llevar.
 */
export function VehicleLoadView() {
  const queryClient = useQueryClient()
  const [vehicleId, setVehicleId] = useState('')
  const [tanda, setTanda] = useState<LoadLine[]>([])

  const vehiculos = useQuery({
    queryKey: ['vehicles', 'load-status'],
    queryFn: vehicleService.getLoadStatus,
  })

  const productos = useQuery({
    queryKey: ['products', 'published'],
    queryFn: () => productService.listPublished(),
  })

  const carga = useQuery({
    queryKey: ['vehicles', 'load', vehicleId],
    queryFn: () => vehicleService.getPendingLoad(vehicleId),
    enabled: Boolean(vehicleId),
  })

  function refrescar() {
    // Tambien el estado de la flota: al cargar, el camion pasa de "disponible" a
    // "ya cargado" y el selector tiene que reflejarlo.
    queryClient.invalidateQueries({ queryKey: ['vehicles'] })
  }

  const cargar = useMutation({
    mutationFn: () => vehicleService.registerLoad(vehicleId, tanda),
    onSuccess: () => {
      setTanda([])
      refrescar()
    },
  })

  const bajar = useMutation({
    mutationFn: (loadId: string) => vehicleService.removeLoad(vehicleId, loadId),
    onSuccess: refrescar,
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    cargar.mutate()
  }

  const lineas = carga.data ?? []
  const flota = vehiculos.data ?? []

  // El camion que esta en la calle no esta en el deposito: no se puede cargar y el
  // backend lo rechaza igual. Queda afuera de la lista en vez de fallar al apretar.
  const enLaCalle = flota.filter((v) => v.isOnRoute)
  const enDeposito = flota.filter((v) => !v.isOnRoute)

  // Los que ya tienen carga arriba se muestran aparte, no se esconden: se carga en
  // varias tandas, y si una linea se cargo mal hay que poder entrar a bajarla.
  const vacios = enDeposito.filter((v) => v.pendingUnits === 0)
  const yaCargados = enDeposito.filter((v) => v.pendingUnits > 0)

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-5 p-6">
      <div>
        <Link to="/" className="text-sm text-slate-500 hover:underline">
          ← Panel
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Cargar camión</h1>
        <p className="text-sm text-slate-600">
          Lo que subas queda arriba del camión hasta que un chofer abra la salida con él.
        </p>
      </div>

      <Select
        label="Vehículo"
        name="vehicleId"
        value={vehicleId}
        onChange={(e) => {
          setVehicleId(e.target.value)
          setTanda([])
        }}
      >
        <option value="">Elegí un vehículo</option>

        {vacios.length > 0 && (
          <optgroup label="Vacíos, listos para cargar">
            {vacios.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.licensePlate})
              </option>
            ))}
          </optgroup>
        )}

        {yaCargados.length > 0 && (
          <optgroup label="Ya tienen carga arriba">
            {yaCargados.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.licensePlate}) · {v.pendingUnits} arriba
              </option>
            ))}
          </optgroup>
        )}
      </Select>

      {/* Una ausencia sin explicar se lee como un error: si falta un camion de la
          lista hay que decir por que, o el proximo paso es revisar si se borro. */}
      {enLaCalle.length > 0 && (
        <p className="text-xs text-slate-500">
          No aparecen {enLaCalle.map((v) => v.licensePlate).join(', ')}: están en la calle con
          una salida abierta. Si se quedaron sin stock, va como recarga en ruta sobre esa
          salida.
        </p>
      )}

      {!vehicleId ? (
        <p className="text-sm text-slate-500">Elegí un vehículo para cargarlo.</p>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-slate-700">Arriba del camión ahora</h2>

            <ErrorMessage error={bajar.error} />

            {carga.isLoading ? (
              <p className="text-sm text-slate-500">Cargando...</p>
            ) : lineas.length === 0 ? (
              <p className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600">
                El camión está vacío. Si sale así, la salida arranca sin stock.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {lineas.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
                  >
                    <div>
                      <p className="text-sm text-slate-900">
                        {l.quantity} × {l.productDetail}
                      </p>
                      <p className="text-xs text-slate-500">{formatDateTime(l.loadedAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => bajar.mutate(l.id)}
                      disabled={bajar.isPending}
                      className="text-xs text-red-600 hover:underline disabled:text-slate-400"
                    >
                      Bajar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-slate-700">Subir más</h2>

            <LoadEditor
              productos={productos.data?.items ?? []}
              valor={tanda}
              onChange={setTanda}
            />

            <ErrorMessage error={cargar.error} />

            <Button type="submit" disabled={cargar.isPending || tanda.length === 0}>
              {cargar.isPending ? 'Cargando...' : 'Cargar al camión'}
            </Button>
          </form>
        </>
      )}
    </main>
  )
}
