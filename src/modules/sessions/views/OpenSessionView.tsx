import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth'
import { ApiError, Button, DataTable, Field, InstallAppButton, Modal, Select, WEEKDAYS, currentBusinessDate, currentBusinessWeekday, weekdayOfDate } from '../../core'
import { driverService } from '../../drivers'
import { scheduleService } from '../../schedule'
import { vehicleService } from '../../vehicles'
import { zoneService, orderedZones, zoneChoices, addZone, moveZone, removeZone } from '../../zones'
import { useOpenSession } from '../hooks/useCurrentSession'
import { zoneCountsForDays } from '../utils/zoneCounts'

/**
 * Solo sin salida abierta: con una abierta la sesión la cierra la recepción, así el
 * chofer no se sale a mitad del reparto. La bandeja del celular no se borra: lo que
 * quedó sin enviar se manda cuando ese chofer vuelve a entrar.
 */
function LogoutButton() {
  const { logout } = useAuth()
  return <Button type="button" variant="secondary" className="self-start" onClick={logout}>Cerrar sesión</Button>
}

/** «Sábado 25/10/2026», del día del negocio. */
function hoyLegible() {
  const fecha = currentBusinessDate()
  const [anio, mes, dia] = fecha.split('-')
  return `${WEEKDAYS.find((d) => d.value === weekdayOfDate(fecha))?.label ?? ''} ${dia}/${mes}/${anio}`
}

/**
 * Apertura de la salida en dos pasos, pensada para el celular:
 * 1. Confirmación del reparto: kilometraje y zonas (vienen las de la agenda).
 * 2. Información del reparto: camión, fecha, carga y orden de las zonas, para revisar
 *    todo junto antes de abrir.
 *
 * La carga no se declara acá: la subió la oficina, y se muestra para que el chofer la
 * confirme contra lo que ve arriba del camión.
 */
export function OpenSessionView() {
  const perfil = useQuery({ queryKey: ['driver', 'me'], queryFn: driverService.getMe })
  const zonas = useQuery({ queryKey: ['zones', 'opening-options'], queryFn: zoneService.listAll })
  const vehicleId = perfil.data?.vehicleId ?? ''
  const carga = useQuery({
    queryKey: ['vehicles', 'load-summary', vehicleId],
    queryFn: () => vehicleService.getPendingLoadSummary(vehicleId),
    enabled: Boolean(vehicleId),
  })
  const suggestion = useQuery({
    queryKey: ['sessions', 'suggested-zone', { vehicleId }],
    queryFn: () => scheduleService.suggested(),
    enabled: Boolean(vehicleId),
  })
  // Cuántos clientes tiene el camión en cada zona, para que la tabla diga cuáles sirven.
  const agendaCamion = useQuery({ queryKey: ['vehicles', 'schedule', vehicleId], queryFn: () => scheduleService.get(vehicleId), enabled: Boolean(vehicleId) })
  const abrir = useOpenSession()

  const [paso, setPaso] = useState<1 | 2>(1)
  const [chosenZones, setZoneIds] = useState<string[] | null>(null)
  const [kilometros, setKilometros] = useState('')
  const [faltaKm, setFaltaKm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Zonas de la agenda que el chofer sacó: al tocar Siguiente se le pregunta, para que no
  // salga sin una zona por error (le quedarían sin aparecer todos sus clientes).
  const [faltantes, setFaltantes] = useState<{ zoneId: string; zoneName: string | null }[] | null>(null)

  if (perfil.isLoading || zonas.isLoading) return <p className="p-6 text-muted">Cargando...</p>
  if (perfil.isError) return <div className="mx-auto flex max-w-md flex-col gap-4 p-4">
    <p className="text-danger">No se pudo leer tu perfil de chofer.</p>
    <LogoutButton />
  </div>
  const chofer = perfil.data!
  // Sin vehículo asignado no puede salir, y el backend lo rechaza igual.
  if (!chofer.vehicleId) return <div className="mx-auto flex max-w-md flex-col gap-4 p-4">
    <p className="text-muted">No tenés un vehículo asignado. Pedile al admin que te asigne uno antes de salir.</p>
    <LogoutButton />
  </div>

  const agenda = orderedZones(suggestion.data)
  const zoneIds = chosenZones ?? agenda.map((z) => z.zoneId)
  const counts = agendaCamion.data && suggestion.data
    ? zoneCountsForDays(agendaCamion.data.customerCounts ?? [], suggestion.data.routeDays, currentBusinessWeekday()) : undefined
  const nombre = (id: string) => zonas.data?.find((z) => z.id === id)?.name ?? agenda.find((z) => z.zoneId === id)?.zoneName ?? 'Zona'
  const opciones = zoneChoices(zonas.data ?? [], zoneIds, counts)
  const conClientes = opciones.filter((z) => z.customers !== 0)
  const lineas = carga.data?.lines ?? []
  const totalCarga = lineas.reduce((s, l) => s + l.quantity, 0)

  function siguiente() {
    if (!kilometros.trim()) { setFaltaKm(true); return }
    const sinElegir = agenda.filter((z) => !zoneIds.includes(z.zoneId))
    if (sinElegir.length) { setFaltantes(sinElegir); return }
    setError(null); setPaso(2)
  }

  async function abrirSalida() {
    setError(null)
    try {
      await abrir.mutateAsync({ zoneIds, kilometersAtOpen: Number(kilometros) })
    } catch (err) {
      setError(err instanceof ApiError
        ? (err.status === 409 && err.type === 'outside-working-hours'
          ? `Fuera del horario laboral. Consultá con la administración. ${err.detail ?? ''}`
          : err.fieldMessages[0] ?? err.detail ?? err.title)
        : 'No se pudo conectar con el servidor.')
    }
  }

  if (paso === 2) return <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
    <Button type="button" variant="secondary" className="self-start" disabled={abrir.isPending} onClick={() => setPaso(1)}>← Volver</Button>

    <section className="rounded-lg border-2 border-brand bg-surface p-4">
      <h1 className="text-lg font-bold">Información del reparto</h1>
      <p className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-base font-semibold">{chofer.vehicleName} · {chofer.vehicleLicensePlate}</span>
        <span className="text-sm text-muted">{hoyLegible()}</span>
      </p>
      <p className="text-sm text-muted">{chofer.firstName} {chofer.lastName} · {kilometros} km</p>
    </section>

    <section className="ui-card flex flex-col gap-2 p-4">
      <h2 className="text-center font-semibold">Carga del camión</h2>
      {carga.isLoading ? <p className="text-sm text-muted">Cargando...</p>
        : carga.isError ? <div role="alert" className="flex flex-col gap-2 rounded border border-danger/30 bg-danger-soft p-3 text-sm">
          {/* Un error de lectura no es un camión vacío: decirlo así haría salir sin carga. */}
          <p>No se pudo leer la carga del camión.</p>
          <Button type="button" variant="secondary" onClick={() => void carga.refetch()}>Reintentar</Button>
        </div>
        : !lineas.length ? <p className="rounded border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
          El camión figura vacío. Si tenés mercadería arriba, avisale a la oficina antes de salir.
        </p>
        : <DataTable stack={false} label="Carga del camión" className="w-full text-sm">
          <thead><tr><th scope="col" className="text-left">Producto</th><th scope="col" className="text-right">Cantidad</th></tr></thead>
          <tbody>{lineas.map((l) => <tr key={l.productId}><td>{l.productDetail}</td><td className="text-right font-semibold tabular-nums">{l.quantity}</td></tr>)}</tbody>
          <tfoot><tr className="font-semibold"><td>Total</td><td className="text-right tabular-nums">{totalCarga}</td></tr></tfoot>
        </DataTable>}
    </section>

    <section className="ui-card flex flex-col gap-2 p-4">
      <h2 className="text-center font-semibold">Detalle de zonas</h2>
      <DataTable stack={false} label="Orden de las zonas" className="w-full text-sm">
        <thead><tr><th scope="col" className="w-16 text-left">Orden</th><th scope="col" className="text-left">Zona</th>{counts && <th scope="col" className="text-right">Clientes</th>}</tr></thead>
        <tbody>{zoneIds.map((id, i) => <tr key={id}><td className="font-semibold">{i + 1}</td><td>{nombre(id)}</td>{counts && <td className="text-right tabular-nums">{counts[id] ?? 0}</td>}</tr>)}</tbody>
      </DataTable>
    </section>

    {error && <p role="alert" className={`text-sm ${abrir.error instanceof ApiError && abrir.error.type === 'outside-working-hours' ? 'rounded border border-warning/40 bg-warning-soft p-3 text-warning' : 'text-danger'}`}>{error}</p>}
    <Button type="button" className="min-h-12 w-full text-base" disabled={abrir.isPending || carga.isLoading || carga.isError || !zoneIds.length} onClick={() => void abrirSalida()}>
      {abrir.isPending ? 'Abriendo...' : 'Abrir salida'}
    </Button>
  </div>

  return <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
    <LogoutButton />

    <section className="rounded-lg border-2 border-brand bg-surface p-4">
      <h1 className="text-lg font-bold">Confirmación del reparto</h1>
      <p className="text-sm text-muted">{chofer.firstName} {chofer.lastName} · {chofer.vehicleName} ({chofer.vehicleLicensePlate})</p>
    </section>

    <section className="ui-card p-4">
      <Field label="Kilometraje del vehículo" name="kilometersAtOpen" type="number" min={0} inputMode="numeric" required
        value={kilometros} onChange={(e) => { setKilometros(e.target.value); setFaltaKm(false) }}
        error={faltaKm ? 'Poné el kilometraje que marca el camión.' : undefined} />
    </section>

    <section className="ui-card flex flex-col gap-3 p-4">
      {zonas.isError && <div role="alert" className="flex flex-col gap-2 text-sm"><p>No se pudieron cargar las zonas.</p>
        <Button type="button" variant="secondary" onClick={() => void zonas.refetch()}>Reintentar</Button></div>}
      {suggestion.isError && <div role="alert" className="flex flex-col gap-2 text-sm"><p>No se pudo leer la agenda.</p>
        <Button type="button" variant="secondary" onClick={() => void suggestion.refetch()}>Reintentar</Button></div>}
      {!zoneIds.length ? <p className="text-sm text-muted">Elegí al menos una zona.</p>
        : <DataTable stack={false} label="Zonas de la salida" className="w-full text-sm">
          <thead><tr><th scope="col" className="px-2 text-left">Zonas</th><th scope="col" className="whitespace-nowrap px-1 text-center text-xs">Clientes</th><th scope="col" className="px-1 text-center"><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>{zoneIds.map((id, i) => {
            const zona = nombre(id)
            return <tr key={id}>
              <td className="px-2 font-medium [overflow-wrap:normal] [word-break:normal]">{i + 1}. {zona}</td>
              <td className="px-1 text-center tabular-nums">{counts ? counts[id] ?? 0 : '—'}</td>
              <td className="px-1"><div className="flex justify-end gap-1 whitespace-nowrap">
                <Button type="button" variant="secondary" className="min-h-11 min-w-10 px-0" aria-label={`Bajar ${zona}`} disabled={i === zoneIds.length - 1} onClick={() => setZoneIds(moveZone(zoneIds, i, 1))}>↓</Button>
                <Button type="button" variant="secondary" className="min-h-11 min-w-10 px-0" aria-label={`Subir ${zona}`} disabled={i === 0} onClick={() => setZoneIds(moveZone(zoneIds, i, -1))}>↑</Button>
                <Button type="button" variant="danger" className="min-h-11 min-w-10 px-0" aria-label={`Quitar ${zona}`} onClick={() => setZoneIds(removeZone(zoneIds, id))}>✕</Button>
              </div></td>
            </tr>
          })}</tbody>
        </DataTable>}
      {/* Solo si hay otra zona con clientes de este camión hoy: agregar una vacía no le muestra nada. */}
      {zoneIds.length < 5 && (counts ? conClientes.length > 0 : opciones.length > 0) && <Select label="Agregar otra zona" value=""
        onChange={(e) => setZoneIds(addZone(zoneIds, e.target.value))}>
        <option value="">Elegí una zona</option>
        {opciones.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
      </Select>}
    </section>

    <Button type="button" className="min-h-12 w-full text-base" disabled={suggestion.isLoading || !zoneIds.length} onClick={siguiente}>Siguiente</Button>
    <div className="text-sm"><InstallAppButton /></div>

    {faltantes && <Modal title="Te falta una zona de hoy" onClose={() => setFaltantes(null)} footer={<>
      <Button type="button" variant="secondary" onClick={() => { setFaltantes(null); setPaso(2) }}>Seguir sin esa zona</Button>
      <Button type="button" onClick={() => { setZoneIds([...new Set([...agenda.map((z) => z.zoneId), ...zoneIds])]); setFaltantes(null); setPaso(2) }}>Agregarla</Button>
    </>}>
      <p>Hoy tenés agendado:</p>
      <p className="text-lg font-semibold">{agenda.map((z) => z.zoneName).join(' → ')}</p>
      <p>No elegiste <strong>{faltantes.map((z) => z.zoneName).join(' ni ')}</strong>. Si salís sin esa zona, sus clientes no te van a aparecer en la hoja.</p>
    </Modal>}
  </div>
}
