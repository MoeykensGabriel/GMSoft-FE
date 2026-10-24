import { useState } from 'react'
import { scheduleService } from '../../schedule'
import { zoneCountsForDays } from '../utils/zoneCounts'
import { SuggestedZoneNotice } from '../components/SuggestedZoneNotice'
import type { FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth'
import { ApiError, Button, Field, InstallAppButton, Modal, weekdayLabels, PageHeader, currentBusinessWeekday } from '../../core'
import { driverService } from '../../drivers'
import { vehicleService } from '../../vehicles'
import { zoneService, orderedZones, sameZones, OrderedZoneEditor } from '../../zones'
import { useOpenSession } from '../hooks/useCurrentSession'

/**
 * Apertura de la salida: el chofer confirma el vehiculo que tiene asignado, carga el
 * kilometraje y elige la zona.
 *
 * La carga no se declara aca: la subio la oficina antes de que el llegara, y se
 * muestra para que la confirme contra lo que ve arriba del camion. Que la declarara
 * el mismo chofer volvia el control de recepcion una copia de lo que el ya dijo.
 */
/**
 * Solo sin salida abierta: con una abierta la sesión la cierra la recepción, así el
 * chofer no se sale a mitad del reparto. La bandeja del celular no se borra: lo que
 * quedó sin enviar se manda cuando ese chofer vuelve a entrar.
 */
function LogoutButton() {
  const { logout } = useAuth()
  return <Button type="button" variant="secondary" onClick={logout}>Cerrar sesión</Button>
}

export function OpenSessionView() {
  const perfil = useQuery({ queryKey: ['driver', 'me'], queryFn: driverService.getMe })
  const zonas = useQuery({ queryKey: ['zones', 'opening-options'], queryFn: zoneService.listAll })

  const vehicleId = perfil.data?.vehicleId ?? ''
  const carga = useQuery({
    queryKey: ['vehicles', 'load-summary', vehicleId],
    queryFn: () => vehicleService.getPendingLoadSummary(vehicleId),
    enabled: Boolean(vehicleId),
  })

  const abrir = useOpenSession()

  const [chosenZones, setZoneIds] = useState<string[] | null>(null)
  const suggestion = useQuery({
    queryKey: ['sessions', 'suggested-zone', { vehicleId }],
    queryFn: () => scheduleService.suggested(),
    enabled: Boolean(vehicleId),
  })
  const suggestedIds = orderedZones(suggestion.data).map((zone) => zone.zoneId)
  // Cuántos clientes tiene el camión en cada zona, para que la lista de zonas diga cuáles sirven.
  const agendaCamion = useQuery({ queryKey: ['vehicles', 'schedule', vehicleId], queryFn: () => scheduleService.get(vehicleId), enabled: Boolean(vehicleId) })
  const zoneIds = chosenZones ?? suggestedIds
  const [kilometros, setKilometros] = useState('')
  const [error, setError] = useState<string | null>(null)
  // Zonas de la agenda que el chofer sacó: antes de abrir se le pregunta, para que no
  // salga sin una zona por error (le quedarían sin aparecer todos sus clientes).
  const [faltantes, setFaltantes] = useState<{ zoneId: string; zoneName: string | null }[] | null>(null)

  if (perfil.isLoading || zonas.isLoading) {
    return <p className="p-6 text-muted">Cargando...</p>
  }

  if (perfil.isError) {
    return <div className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <p className="text-danger">No se pudo leer tu perfil de chofer.</p>
      <LogoutButton />
    </div>
  }

  const chofer = perfil.data!

  // Sin vehiculo asignado no puede salir, y el backend lo rechaza igual. Mejor
  // decirlo antes de que llene el formulario que despues de mandarlo.
  if (!chofer.vehicleId) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 p-6">
        <p className="text-muted">
          No tenés un vehículo asignado. Pedile al admin que te asigne uno antes de salir.
        </p>
        <LogoutButton />
      </div>
    )
  }

  const agenda = orderedZones(suggestion.data)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const sinElegir = agenda.filter((z) => !zoneIds.includes(z.zoneId))
    if (sinElegir.length) { setFaltantes(sinElegir); return }
    await abrirCon(zoneIds)
  }

  async function abrirCon(ids: string[]) {
    setFaltantes(null)
    setError(null)

    try {
      await abrir.mutateAsync({ zoneIds: ids, kilometersAtOpen: Number(kilometros) })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 409 && err.type === 'outside-working-hours'
          ? `Fuera del horario laboral. Consultá con la administración. ${err.detail ?? ''}`
          : err.fieldMessages[0] ?? err.detail ?? err.title)
      } else {
        setError('No se pudo conectar con el servidor.')
      }
    }
  }

  // Sumada por producto: al chofer le importa cuanto lleva, no en cuantas tandas
  // lo cargo la oficina.
  const lineas = carga.data?.lines ?? []
  const routeDays = carga.data?.routeDays ?? []

  return (
    <form onSubmit={onSubmit} className="ui-card mx-auto flex max-w-md flex-col gap-5 p-6">
      <div>
        <PageHeader title={<>Abrir salida</>} />
        <p className="mt-1 text-sm text-muted">
          {chofer.firstName} {chofer.lastName} · {chofer.vehicleName} ({chofer.vehicleLicensePlate})
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted">Vas a salir con</span>

        {carga.isLoading ? (
          <p className="text-sm text-muted">Cargando...</p>
        ) : carga.isError ? (
          // Un error de lectura no es un camión vacío: decirlo así haría salir sin carga.
          <div role="alert" className="flex flex-col gap-2 rounded border border-danger/30 bg-danger-soft p-3 text-sm">
            <p>No se pudo leer la carga del camión.</p>
            <Button type="button" variant="secondary" onClick={() => void carga.refetch()}>Reintentar</Button>
          </div>
        ) : lineas.length === 0 ? (
          <p className="rounded border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
            El camión figura vacío. Si tenés mercadería arriba, avisale a la oficina antes de
            salir: lo que no esté cargado acá va a figurar como faltante cuando vuelvas.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {lineas.map((l) => (
              <li
                key={l.productId}
                className="flex justify-between ui-card bg-surface px-3 py-2 text-sm"
              >
                <span className="text-muted">{l.productDetail}</span>
                <span className="text-ink">{l.quantity} unidades</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <OrderedZoneEditor value={zoneIds} options={zonas.data ?? []} onChange={setZoneIds} disabled={abrir.isPending}
        counts={agendaCamion.data && suggestion.data ? zoneCountsForDays(agendaCamion.data.customerCounts ?? [], suggestion.data.routeDays, currentBusinessWeekday()) : undefined} />
      {zonas.isError && <div role="alert" className="flex flex-col gap-2 text-sm">
        <p>No se pudieron cargar las zonas.</p>
        <Button type="button" variant="secondary" onClick={() => void zonas.refetch()}>Reintentar</Button>
      </div>}
      {suggestion.isError && <div role="alert"><p>No se pudo leer la agenda sugerida.</p><Button type="button" variant="secondary" onClick={() => void suggestion.refetch()}>Reintentar agenda</Button></div>}
      <SuggestedZoneNotice suggestion={suggestion.data} zoneIds={zoneIds} />
      {routeDays.length > 0 && <p className="text-sm">Días del recorrido: <strong>{weekdayLabels(routeDays)}</strong></p>}

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
        <p role="alert" className={`text-sm ${abrir.error instanceof ApiError && abrir.error.type === 'outside-working-hours' ? 'rounded border border-warning/40 bg-warning-soft p-3 text-warning' : 'text-danger'}`}>
          {error}
        </p>
      )}

      <Button type="submit" disabled={!zoneIds.length || suggestion.isLoading || abrir.isPending || carga.isLoading || carga.isError}>
        {abrir.isPending ? 'Abriendo...' : suggestion.data && !sameZones(zoneIds, suggestedIds) ? 'Guardar igual y abrir salida' : 'Abrir salida'}
      </Button>
      <InstallAppButton />
      <LogoutButton />

      {faltantes && <Modal title="Te falta una zona de hoy" busy={abrir.isPending} onClose={() => setFaltantes(null)} footer={<>
        <Button type="button" variant="secondary" onClick={() => void abrirCon(zoneIds)}>Salir sin esa zona</Button>
        <Button type="button" onClick={() => { const ids = [...new Set([...agenda.map((z) => z.zoneId), ...zoneIds])]; setZoneIds(ids); void abrirCon(ids) }}>
          Agregarla y abrir
        </Button>
      </>}>
        <p>Hoy tenés agendado:</p>
        <p className="text-lg font-semibold">{agenda.map((z) => z.zoneName).join(' → ')}</p>
        <p>No elegiste <strong>{faltantes.map((z) => z.zoneName).join(' ni ')}</strong>. Si salís sin esa zona, sus clientes no te van a aparecer en la hoja.</p>
      </Modal>}
    </form>
  )
}
