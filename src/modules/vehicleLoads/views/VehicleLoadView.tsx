import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, BUSINESS_TIME_ZONE, Button, DataTable, ErrorMessage, LinkButton, Modal, QuantityInput, Select, WeekdaysField, formatDateTime, currentBusinessWeekday, newRequestId, Page, PageHeader } from '../../core'
import { productService } from '../../products'
import { driverService } from '../../drivers'
import { VehicleAssignmentSummary } from '../components/VehicleAssignmentSummary'
import { LoadConfirmModal } from '../components/LoadConfirmModal'
import { draftItems, sameLoad, totalsByProduct } from '../utils/loadTable'
import { vehicleService } from '../../vehicles'

/**
 * Cargar el camion, de manana, antes de que salga el chofer.
 *
 * Una sola tabla con lo que hay arriba del camión, un renglón por producto. Con
 * «Editar» (naranja) se cambian las cantidades con − y +; «Confirmar» (verde) abre el
 * resumen y guarda la carga tal como quedó en la tabla; «Vaciar carga» (rojo) baja todo.
 * Lo que se sube queda esperando hasta que el chofer abre la salida con ese camión.
 */
export function VehicleLoadView() {
  const queryClient = useQueryClient()
  const attempt = useRef<{ vehicleId: string; items: { productId: string; quantity: number }[]; routeDays: number[]; requestId: string; confirmOutsideWorkingHours: boolean } | null>(null)
  const sending = useRef(false)
  const [params] = useSearchParams()
  const [vehicleId, setVehicleId] = useState(() => params.get('vehiculo') ?? '')
  // La tabla en edición: cuánto tiene que quedar arriba de cada producto. Null es solo mirar.
  const [draft, setDraft] = useState<Record<string, number> | null>(null)
  const [success, setSuccess] = useState(false)
  // Identifica el pedido que se está armando: se conserva entre reintentos, así no se duplica.
  const [requestId, setRequestId] = useState(newRequestId)
  const [confirmandoDesde, setConfirmandoDesde] = useState<Date | null>(null)
  const [loadedAt, setLoadedAt] = useState<string | null>(null)
  const [editedDays, setEditedDays] = useState<number[] | null>(null)
  const [vaciando, setVaciando] = useState(false)
  // Recién cargado: se ofrece abrir la salida ahí mismo, sin ir a Salidas y recepción.
  const [recienCargado, setRecienCargado] = useState(false)
  const navigate = useNavigate()
  const drivers = useQuery({ queryKey: ['drivers', 'active'], queryFn: driverService.listActive })
  const vehiculos = useQuery({ queryKey: ['vehicles', 'load-status'], queryFn: vehicleService.getLoadStatus })
  const productos = useQuery({ queryKey: ['products', 'published'], queryFn: () => productService.listPublished() })
  const carga = useQuery({
    queryKey: ['vehicles', 'load', vehicleId],
    queryFn: () => vehicleService.getPendingLoad(vehicleId),
    enabled: Boolean(vehicleId),
  })

  const lineas = carga.data ?? []
  const arriba = totalsByProduct(lineas)
  const listaProductos = productos.data?.items ?? []
  // Un camión vacío no tiene nada que mirar: arranca directamente en edición.
  const vacio = carga.isSuccess && lineas.length === 0
  const tabla = draft ?? (vacio ? {} : null)
  const editando = tabla !== null
  const cambioCarga = editando && !sameLoad(tabla, arriba)

  const pendingDays = [...new Set(lineas.flatMap((line) => line.routeDays ?? []))].sort((a, b) => a - b)
  const routeDays = editedDays ?? (pendingDays.length ? pendingDays : [currentBusinessWeekday()])
  const daysChanged = routeDays.join(',') !== pendingDays.join(',')

  async function refrescar() {
    // También el estado de la flota: al cargar, el camión pasa de "vacío" a "ya cargado".
    await queryClient.invalidateQueries({ queryKey: ['vehicles'] })
  }

  function reiniciar() {
    setDraft(null); setEditedDays(null); setConfirmandoDesde(null); setRequestId(newRequestId())
  }

  const cargar = useMutation({
    retry: false,
    mutationFn: async (confirmOutside: boolean) => {
      if (!cambioCarga) {
        await vehicleService.updateRouteDays(vehicleId, routeDays)
        return null
      }
      if (!attempt.current) attempt.current = structuredClone({ vehicleId, items: draftItems(tabla!), routeDays, requestId, confirmOutsideWorkingHours: false })
      // El consentimiento se captura en el clic, antes de que la mutación limpie el error.
      if (confirmOutside) attempt.current.confirmOutsideWorkingHours = true
      const body = attempt.current
      // Reemplaza: el camión queda exactamente con lo que dice la tabla, aunque se hayan bajado cantidades.
      return (await vehicleService.registerLoad(body.vehicleId, body.items, body.routeDays, body.requestId, body.confirmOutsideWorkingHours, true)).loadedAt
    },
    onSuccess: async (registrada) => {
      await refrescar()
      attempt.current = null
      reiniciar()
      setLoadedAt(registrada)
      setSuccess(true)
      if (registrada) setRecienCargado(true)
    },
  })

  const canCorrect = cargar.isIdle || (cargar.error instanceof ApiError && [400, 403, 404, 409].includes(cargar.error.status))
  async function sendLoad() {
    if (sending.current) return
    sending.current = true
    const outside = cargar.error instanceof ApiError && cargar.error.status === 409 && cargar.error.type === 'outside-working-hours'
    try { await cargar.mutateAsync(outside) } catch { /* El modal conserva el pedido y muestra el error. */ }
    finally { sending.current = false }
  }

  const vaciar = useMutation({
    mutationFn: () => vehicleService.clearLoad(vehicleId),
    onSuccess: async () => { await refrescar(); reiniciar(); setSuccess(false) },
    onSettled: () => setVaciando(false),
  })

  const ocupado = cargar.isPending || vaciar.isPending
  const puedeConfirmar = !ocupado && !carga.isPending && !carga.isError && routeDays.length > 0
    && ((cambioCarga && draftItems(tabla!).length > 0) || (!editando && lineas.length > 0 && daysChanged))

  function confirmar() {
    if (!puedeConfirmar) return
    // Con cambios en la tabla, primero el resumen: nada se registra hasta confirmarlo ahí.
    if (cambioCarga) {
      cargar.reset(); setSuccess(false); setConfirmandoDesde(new Date())
      return
    }
    cargar.mutate(false)
  }

  const flota = vehiculos.data ?? []
  const selectedVehicle = flota.find((vehicle) => vehicle.id === vehicleId)
  // El camión que está en la calle no está en el depósito: no se puede cargar.
  const enLaCalle = flota.filter((v) => v.isOnRoute)
  const enDeposito = flota.filter((v) => !v.isOnRoute)
  const vacios = enDeposito.filter((v) => v.pendingUnits === 0)
  const yaCargados = enDeposito.filter((v) => v.pendingUnits > 0)
  const totalTabla = listaProductos.reduce((sum, p) => sum + ((tabla ?? arriba)[p.id] ?? 0), 0)

  return (
    <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      <div>
        <PageHeader title={<>Carga inicial de vehículos</>}
          actions={<LinkButton to={vehicleId ? `/panel/carga/bajadas?vehiculo=${vehicleId}` : '/panel/carga/bajadas'}>Cargas bajadas</LinkButton>} />
        <p className="text-sm text-muted">Prepará los productos llenos que llevará el vehículo antes de iniciar el reparto.</p>
      </div>

      <Select label="Vehículo" name="vehicleId" value={vehicleId} disabled={ocupado}
        onChange={(e) => { setVehicleId(e.target.value); reiniciar(); setSuccess(false); setLoadedAt(null); cargar.reset(); vaciar.reset() }}>
        <option value="">Elegí un vehículo</option>
        {vacios.length > 0 && <optgroup label="Vacíos, listos para cargar">
          {vacios.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.licensePlate})</option>)}
        </optgroup>}
        {yaCargados.length > 0 && <optgroup label="Ya tienen carga arriba">
          {yaCargados.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.licensePlate}) · {v.pendingUnits} arriba</option>)}
        </optgroup>}
      </Select>
      <ErrorMessage error={vehiculos.error ?? drivers.error} />
      {selectedVehicle && !drivers.isPending && !drivers.isError && <VehicleAssignmentSummary
        vehicleName={selectedVehicle.name} licensePlate={selectedVehicle.licensePlate}
        drivers={(drivers.data ?? []).filter((driver) => driver.vehicleId === vehicleId)} />}
      {success && <p role="status" className="rounded border border-success bg-success-light p-3 text-black">{loadedAt
        ? `Carga registrada el ${formatDateTime(loadedAt, BUSINESS_TIME_ZONE)}: el chofer ya puede abrir la salida.`
        : 'Días del recorrido guardados.'}</p>}

      {/* Una ausencia sin explicar se lee como un error: si falta un camión hay que decir por qué. */}
      {enLaCalle.length > 0 && <p className="text-xs text-muted">
        No aparecen {enLaCalle.map((v) => v.licensePlate).join(', ')}: están en la calle con una salida abierta.
        Si se quedaron sin stock, se recargan desde <Link to="/panel/recargas" className="ui-link">Recargas</Link>.
      </p>}

      {!vehicleId || !selectedVehicle ? <p className="text-sm text-muted">Elegí un vehículo para cargarlo.</p> : <>
        <section className="ui-card flex flex-col gap-4 p-4">
          <h2 className="text-lg font-semibold">Carga actual del camión: {selectedVehicle.name} · {selectedVehicle.licensePlate}</h2>
          <ErrorMessage error={productos.error ?? carga.error ?? vaciar.error} />
          {carga.isPending || productos.isPending ? <p className="text-sm text-muted">Cargando...</p>
            : !listaProductos.length ? <p className="text-sm text-muted">No hay productos publicados. Publicalos en el catálogo antes de cargar el camión.</p>
            : <>
              {vacio && <p className="text-sm text-muted">El camión está vacío. Poné cuánto lleva de cada producto y confirmá.</p>}
              <DataTable stack={false} label="Carga del camión" className="w-full">
                <thead><tr><th scope="col">Producto</th><th scope="col" className="w-56 text-center">Cantidad</th></tr></thead>
                <tbody>{listaProductos.map((p) => {
                  const actual = arriba[p.id] ?? 0
                  const valor = tabla?.[p.id] ?? (editando ? 0 : actual)
                  return <tr key={p.id}>
                    <td className="font-medium">{p.detail}
                      {editando && !vacio && valor !== actual && <span className="block text-xs text-muted">Antes: {actual}</span>}</td>
                    <td className="text-center">{editando
                      ? <QuantityInput hideLabel label={`Cantidad de ${p.detail}`} value={valor}
                          onChange={(q) => { setDraft({ ...(tabla ?? {}), [p.id]: q }); setSuccess(false); setRequestId(newRequestId()) }} />
                      : <span className={`text-lg font-semibold ${actual ? '' : 'text-muted'}`}>{actual || '—'}</span>}</td>
                  </tr>
                })}</tbody>
              </DataTable>
              <p className="text-right font-medium">Total: {totalTabla} unidades</p>
            </>}

          <div className="flex flex-wrap justify-end gap-3">
            {lineas.length > 0 && !editando && <Button type="button" variant="edit" disabled={ocupado}
              onClick={() => { setDraft({ ...arriba }); setSuccess(false); setRequestId(newRequestId()) }}>Editar</Button>}
            {lineas.length > 0 && editando && <Button type="button" variant="secondary" disabled={ocupado} onClick={() => setDraft(null)}>Cancelar cambios</Button>}
            {lineas.length > 0 && <Button type="button" variant="danger" disabled={ocupado} onClick={() => { vaciar.reset(); setVaciando(true) }}>Vaciar carga</Button>}
            <Button type="button" disabled={!puedeConfirmar} onClick={confirmar}>
              {cargar.isPending ? 'Guardando...' : !cambioCarga && daysChanged && lineas.length ? 'Guardar días' : 'Confirmar'}
            </Button>
          </div>
          {!confirmandoDesde && <ErrorMessage error={cargar.error} />}
        </section>

        <WeekdaysField label="Días de reparto que cubrirá esta salida" value={routeDays}
          disabled={ocupado || carga.isPending || carga.isError}
          onChange={(days) => { setEditedDays(days); setSuccess(false); setRequestId(newRequestId()) }} />
        <p className="text-sm text-muted">Podés combinar varios días para recuperar un reparto. Los clientes aparecerán una sola vez, en el orden habitual.</p>
      </>}

      {confirmandoDesde && selectedVehicle && tabla && <LoadConfirmModal
        vehicleName={selectedVehicle.name}
        licensePlate={selectedVehicle.licensePlate}
        driverNames={(drivers.data ?? []).filter((d) => d.vehicleId === vehicleId).map((d) => `${d.firstName} ${d.lastName}`)}
        routeDays={routeDays}
        lines={listaProductos.flatMap((p) => {
          const queda = tabla[p.id] ?? 0
          const antes = arriba[p.id] ?? 0
          if (!queda && !antes) return []
          return [{ productId: p.id, productDetail: p.detail, quantity: queda, totalOnBoard: queda, ...(lineas.length ? { before: antes } : {}) }]
        })}
        openedAt={confirmandoDesde}
        sending={cargar.isPending}
        error={cargar.error}
        backDisabled={!canCorrect}
        notice={cargar.isError && !canCorrect ? 'No pudimos confirmar el resultado. Reintentá sin cambiar el pedido para evitar duplicarlo.' : undefined}
        onBack={() => { attempt.current = null; setConfirmandoDesde(null); cargar.reset() }}
        onConfirm={() => { void sendLoad() }}
      />}

      {recienCargado && selectedVehicle && (() => {
        const choferes = (drivers.data ?? []).filter((d) => d.vehicleId === vehicleId)
        // Con un solo chofer asignado, la salida se abre ya con él elegido.
        const destino = choferes.length === 1 ? `/panel/salidas/abrir?chofer=${choferes[0].id}` : '/panel/salidas/abrir'
        return <Modal title="Carga registrada" onClose={() => setRecienCargado(false)} footer={<>
          <Button type="button" variant="secondary" onClick={() => setRecienCargado(false)}>Dejarlo cargado</Button>
          <Button type="button" disabled={!choferes.length} onClick={() => navigate(destino)}>Abrir salida ahora</Button>
        </>}>
          <p>El <strong>{selectedVehicle.name} · {selectedVehicle.licensePlate}</strong> quedó cargado.</p>
          <p>{choferes.length
            ? <>Podés abrir la salida ahora{choferes.length === 1 ? <> con <strong>{choferes[0].firstName} {choferes[0].lastName}</strong></> : ''}, o dejarlo cargado para que el chofer la abra desde su celular.</>
            : 'Este camión no tiene chofer asignado: asignale uno en Choferes para que pueda salir.'}</p>
        </Modal>
      })()}

      {vaciando && <Modal title="Vaciar la carga" busy={vaciar.isPending} onClose={() => setVaciando(false)} footer={<>
        <Button type="button" variant="secondary" disabled={vaciar.isPending} onClick={() => setVaciando(false)}>Cancelar</Button>
        <Button type="button" variant="danger" disabled={vaciar.isPending} onClick={() => vaciar.mutate()}>{vaciar.isPending ? 'Vaciando...' : 'Vaciar carga'}</Button>
      </>}>
        <p>Se baja todo lo que está arriba del camión:</p>
        <ul className="flex flex-col gap-1 font-semibold">
          {listaProductos.filter((p) => arriba[p.id]).map((p) => <li key={p.id}>{arriba[p.id]} × {p.detail}</li>)}
        </ul>
        <p className="text-muted">El chofer no va a poder salir hasta que registres una carga nueva.</p>
      </Modal>}
    </Page>
  )
}
