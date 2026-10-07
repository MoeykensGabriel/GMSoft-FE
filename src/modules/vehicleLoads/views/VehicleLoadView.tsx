import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BUSINESS_TIME_ZONE, Button, ErrorMessage, Select, WeekdaysField, formatDateTime, currentBusinessWeekday, newRequestId } from '../../core'
import { productService } from '../../products'
import { driverService } from '../../drivers'
import { VehicleAssignmentSummary } from '../components/VehicleAssignmentSummary'
import { LoadEditor } from '../components/LoadEditor'
import type { LoadLine } from '../components/LoadEditor'
import { LoadConfirmModal } from '../components/LoadConfirmModal'
import { vehicleService } from '../../vehicles'

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
  const [success, setSuccess] = useState(false)
  // Identifica la tanda que se esta armando. Se conserva entre reintentos de la misma
  // carga y cambia cuando cambia lo que se va a enviar, asi un reintento no duplica.
  const [requestId, setRequestId] = useState(newRequestId)
  // Cuando se abrio el resumen; null si esta cerrado.
  const [confirmandoDesde, setConfirmandoDesde] = useState<Date | null>(null)
  // Hora que devolvio el servidor para la ultima carga registrada.
  const [loadedAt, setLoadedAt] = useState<string | null>(null)
  const [editedDays, setEditedDays] = useState<number[] | null>(null)
  const drivers = useQuery({ queryKey: ['drivers', 'active'], queryFn: driverService.listActive })

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

  async function refrescar() {
    // Tambien el estado de la flota: al cargar, el camion pasa de "disponible" a
    // "ya cargado" y el selector tiene que reflejarlo.
    await queryClient.invalidateQueries({ queryKey: ['vehicles'] })
  }

  const pendingDays = [...new Set((carga.data ?? []).flatMap((line) => line.routeDays ?? []))].sort((a, b) => a - b)
  const todayIso = currentBusinessWeekday()
  const routeDays = editedDays ?? (pendingDays.length ? pendingDays : [todayIso])
  const daysChanged = routeDays.join(',') !== pendingDays.join(',')

  const cargar = useMutation({
    mutationFn: async () => {
      if (!tanda.length) {
        await vehicleService.updateRouteDays(vehicleId, routeDays)
        return null
      }
      return (await vehicleService.registerLoad(vehicleId, tanda, routeDays, requestId)).loadedAt
    },
    onSuccess: async (registrada) => {
      await refrescar()
      setTanda([])
      setEditedDays(null)
      setConfirmandoDesde(null)
      setRequestId(newRequestId())
      setLoadedAt(registrada)
      setSuccess(true)
    },
  })

  const bajar = useMutation({
    mutationFn: (loadId: string) => vehicleService.removeLoad(vehicleId, loadId),
    onSuccess: refrescar,
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (cargar.isPending || bajar.isPending || !vehicleId || !routeDays.length || carga.isPending || carga.isError) return
    if (!tanda.length && (!carga.data?.length || !daysChanged)) return
    // Con productos, primero el resumen: nada se registra hasta confirmarlo ahi.
    if (tanda.length) {
      cargar.reset()
      setSuccess(false)
      setConfirmandoDesde(new Date())
      return
    }
    cargar.mutate()
  }

  const lineas = carga.data ?? []
  const flota = vehiculos.data ?? []
  const selectedVehicle = flota.find((vehicle) => vehicle.id === vehicleId)

  // El camion que esta en la calle no esta en el deposito: no se puede cargar y el
  // backend lo rechaza igual. Queda afuera de la lista en vez de fallar al apretar.
  const enLaCalle = flota.filter((v) => v.isOnRoute)
  const enDeposito = flota.filter((v) => !v.isOnRoute)

  // Los que ya tienen carga arriba se muestran aparte, no se esconden: se carga en
  // varias tandas, y si una linea se cargo mal hay que poder entrar a bajarla.
  const vacios = enDeposito.filter((v) => v.pendingUnits === 0)
  const yaCargados = enDeposito.filter((v) => v.pendingUnits > 0)

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      <div>
        <h1 className="mt-2 border-b border-neutral-300 py-4 text-center text-2xl font-semibold text-neutral-900">Carga inicial de vehículos</h1>
        <p className="text-sm text-neutral-600">
          Prepará los productos llenos que llevará el vehículo antes de iniciar el reparto.
        </p>
      </div>

      <Select
        label="Vehículo"
        name="vehicleId"
        value={vehicleId}
        disabled={cargar.isPending || bajar.isPending}
        onChange={(e) => {
          setVehicleId(e.target.value)
          setTanda([])
          setEditedDays(null)
          setSuccess(false)
          setLoadedAt(null)
          setConfirmandoDesde(null)
          setRequestId(newRequestId())
          cargar.reset()
          bajar.reset()
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
      <ErrorMessage error={vehiculos.error ?? drivers.error} />
      {selectedVehicle && !drivers.isPending && !drivers.isError && <VehicleAssignmentSummary
        vehicleName={selectedVehicle.name} licensePlate={selectedVehicle.licensePlate}
        drivers={(drivers.data ?? []).filter((driver) => driver.vehicleId === vehicleId)} />}
      {success && <p role="status">{loadedAt
        ? `Carga registrada el ${formatDateTime(loadedAt, BUSINESS_TIME_ZONE)}. El chofer ya puede abrir la salida.`
        : 'Días del recorrido guardados.'}</p>}

      {/* Una ausencia sin explicar se lee como un error: si falta un camion de la
          lista hay que decir por que, o el proximo paso es revisar si se borro. */}
      {enLaCalle.length > 0 && (
        <p className="text-xs text-neutral-500">
          No aparecen {enLaCalle.map((v) => v.licensePlate).join(', ')}: están en la calle con
          una salida abierta. Si se quedaron sin stock, va como recarga en ruta sobre esa
          salida.
        </p>
      )}

      {!vehicleId ? (
        <p className="text-sm text-neutral-500">Elegí un vehículo para cargarlo.</p>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-neutral-700">Arriba del camión ahora</h2>

            <ErrorMessage error={bajar.error} />

            {carga.isLoading ? (
              <p className="text-sm text-neutral-500">Cargando...</p>
            ) : lineas.length === 0 ? (
              <p className="rounded-md border border-neutral-200 bg-white p-3 text-sm text-neutral-600">
                El camión está vacío. Registrá una carga para habilitar la salida del chofer.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {lineas.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2"
                  >
                    <div>
                      <p className="text-sm text-neutral-900">
                        {l.quantity} × {l.productDetail}
                      </p>
                      <p className="text-xs text-neutral-500">{formatDateTime(l.loadedAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => bajar.mutate(l.id)}
                      disabled={bajar.isPending || cargar.isPending}
                      className="rounded-md bg-red-700 px-3 py-2 text-white hover:bg-red-800 disabled:bg-neutral-400"
                    >
                      Bajar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <WeekdaysField label="Días de reparto que cubrirá esta salida" value={routeDays}
              disabled={cargar.isPending || bajar.isPending || carga.isPending || carga.isError}
              onChange={(days) => { setEditedDays(days); setSuccess(false); setRequestId(newRequestId()) }} />
            <p className="text-sm text-neutral-600">Podés combinar varios días para recuperar un reparto. Los clientes aparecerán una sola vez, en el orden habitual.</p>
            <h2 className="rounded-md border border-neutral-300 py-4 text-center font-semibold">{lineas.length ? 'Agregar productos a la carga' : 'Carga inicial'}</h2>
            <ErrorMessage error={productos.error ?? carga.error} />

            <fieldset disabled={cargar.isPending || bajar.isPending}>
            <LoadEditor
              productos={productos.data?.items ?? []}
              valor={tanda}
              onChange={(lines) => { setTanda(lines); setRequestId(newRequestId()) }}
            />
            </fieldset>

            {!confirmandoDesde && <ErrorMessage error={cargar.error} />}

            <p className="text-right font-medium">Total a cargar: {tanda.reduce((sum, line) => sum + line.quantity, 0)} unidades</p>
            <Button type="submit" className="self-end" disabled={cargar.isPending || bajar.isPending || productos.isPending || productos.isError || carga.isPending || carga.isError || !routeDays.length || (!tanda.length && (!lineas.length || !daysChanged))}>
              {cargar.isPending ? 'Guardando...' : tanda.length ? 'Confirmar' : 'Guardar días del recorrido'}
            </Button>
          </form>
        </>
      )}

      {confirmandoDesde && selectedVehicle && (
        <LoadConfirmModal
          vehicleName={selectedVehicle.name}
          licensePlate={selectedVehicle.licensePlate}
          driverNames={(drivers.data ?? [])
            .filter((driver) => driver.vehicleId === vehicleId)
            .map((driver) => `${driver.firstName} ${driver.lastName}`)}
          routeDays={routeDays}
          lines={(productos.data?.items ?? []).flatMap((producto) => {
            const quantity = tanda.find((line) => line.productId === producto.id)?.quantity ?? 0
            if (quantity === 0) return []
            const yaArriba = lineas
              .filter((line) => line.productId === producto.id)
              .reduce((sum, line) => sum + line.quantity, 0)
            return [{ productId: producto.id, productDetail: producto.detail, quantity, totalOnBoard: yaArriba + quantity }]
          })}
          openedAt={confirmandoDesde}
          sending={cargar.isPending}
          error={cargar.error}
          onBack={() => { setConfirmandoDesde(null); cargar.reset() }}
          onConfirm={() => { if (!cargar.isPending) cargar.mutate() }}
        />
      )}
    </main>
  )
}
