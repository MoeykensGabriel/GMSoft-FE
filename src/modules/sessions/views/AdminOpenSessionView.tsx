import { useState } from 'react'
import { scheduleService } from '../../schedule'
import { SuggestedZoneNotice } from '../components/SuggestedZoneNotice'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ApiError, Button, ErrorMessage, Field, Modal, Page, PageHeader, Panel, Select, BackButton } from '../../core'
import { driverService } from '../../drivers'
import { zoneService, orderedZones, sameZones, OrderedZoneEditor } from '../../zones'
import { sessionService } from '../services/sessionService'

const isOutside = (error: unknown): error is ApiError =>
  error instanceof ApiError && error.status === 409 && error.type === 'outside-working-hours'

/**
 * ADMIN abre la salida en nombre de un chofer. Es la salida de emergencia del horario
 * laboral: el chofer no puede saltear el bloqueo, la oficina sí, confirmándolo.
 */
export function AdminOpenSessionView() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const choferes = useQuery({ queryKey: ['drivers', 'active'], queryFn: driverService.listActive })
  const zonas = useQuery({ queryKey: ['zones', 'opening-options'], queryFn: zoneService.listAll })

  const [driverId, setDriverId] = useState('')
  const [chosenZones, setZoneIds] = useState<string[] | null>(null)
  const suggestion = useQuery({
    queryKey: ['sessions', 'suggested-zone', { driverId }],
    queryFn: () => scheduleService.suggested(driverId),
    enabled: Boolean(driverId),
  })
  const suggestedIds = orderedZones(suggestion.data).map((zone) => zone.zoneId)
  const zoneIds = chosenZones ?? suggestedIds
  const [kilometros, setKilometros] = useState('')
  // Zonas de la agenda que se sacaron: se pregunta antes de abrir, igual que al chofer.
  const [faltantes, setFaltantes] = useState<{ zoneId: string; zoneName: string | null }[] | null>(null)
  const agenda = orderedZones(suggestion.data)

  const abrir = useMutation({
    mutationFn: ({ ids, confirmOutsideWorkingHours }: { ids: string[]; confirmOutsideWorkingHours: boolean }) => sessionService.open({
      driverId, zoneIds: ids, kilometersAtOpen: Number(kilometros), confirmOutsideWorkingHours,
    }),
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: ['sessions'] })
      navigate(`/panel/salidas/${id}`)
    },
  })

  const conCamion = (choferes.data ?? []).filter((c) => c.vehicleId)
  const fueraDeHorario = isOutside(abrir.error) ? abrir.error : null

  return (
    <Page className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
      <BackButton to="/panel/salidas" label="Volver a Salidas" />
      <PageHeader title="Abrir salida" />

      <Panel title="Salida en nombre de un chofer">
        <form className="flex max-w-md flex-col gap-4" onSubmit={(event) => {
          event.preventDefault()
          const sinElegir = agenda.filter((z) => !zoneIds.includes(z.zoneId))
          if (sinElegir.length) setFaltantes(sinElegir)
          else abrir.mutate({ ids: zoneIds, confirmOutsideWorkingHours: false })
        }}>
          <ErrorMessage error={choferes.error ?? zonas.error} />

          <Select label="Chofer" name="driverId" required value={driverId} onChange={(e) => { setDriverId(e.target.value); setZoneIds(null) }}>
            <option value="">Elegí un chofer</option>
            {conCamion.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName} · {c.vehicleName} ({c.vehicleLicensePlate})</option>
            ))}
          </Select>

      <OrderedZoneEditor value={zoneIds} options={zonas.data ?? []} onChange={setZoneIds} disabled={abrir.isPending} />

          {suggestion.isError && <div role="alert"><p>No se pudo leer la agenda sugerida.</p><Button type="button" variant="secondary" onClick={() => void suggestion.refetch()}>Reintentar agenda</Button></div>}
      <SuggestedZoneNotice suggestion={suggestion.data} zoneIds={zoneIds} />
          <Field label="Kilometraje del vehículo" name="kilometersAtOpen" type="number" min={0} inputMode="numeric" required
            value={kilometros} onChange={(e) => setKilometros(e.target.value)} />

          {!fueraDeHorario && <ErrorMessage error={abrir.error} />}

          <Button type="submit" className="self-start" disabled={!zoneIds.length || suggestion.isLoading || abrir.isPending}>
            {abrir.isPending ? 'Abriendo...' : suggestion.data && !sameZones(zoneIds, suggestedIds) ? 'Guardar igual y abrir salida' : 'Abrir salida'}
          </Button>
        </form>
      </Panel>

      {fueraDeHorario && (
        <Modal title="Fuera del horario laboral" busy={abrir.isPending} onClose={() => abrir.reset()}
          footer={<>
            <Button type="button" variant="danger" disabled={abrir.isPending} onClick={() => abrir.reset()}>Cancelar</Button>
            <Button type="button" disabled={abrir.isPending} onClick={() => abrir.mutate({ ids: abrir.variables?.ids ?? zoneIds, confirmOutsideWorkingHours: true })}>
              {abrir.isPending ? 'Abriendo...' : 'Abrir igual'}
            </Button>
          </>}>
          <p>{fueraDeHorario.detail?.replace(/^Fuera del horario laboral\.\s*/, '')}</p>
          <p className="text-muted">La salida va a quedar marcada como abierta fuera de horario.</p>
        </Modal>
      )}

      {faltantes && <Modal title="Falta una zona de hoy" busy={abrir.isPending} onClose={() => setFaltantes(null)} footer={<>
        <Button type="button" variant="secondary" onClick={() => { setFaltantes(null); abrir.mutate({ ids: zoneIds, confirmOutsideWorkingHours: false }) }}>Abrir sin esa zona</Button>
        <Button type="button" onClick={() => {
          const ids = [...new Set([...agenda.map((z) => z.zoneId), ...zoneIds])]
          setZoneIds(ids); setFaltantes(null); abrir.mutate({ ids, confirmOutsideWorkingHours: false })
        }}>Agregarla y abrir</Button>
      </>}>
        <p>Este camión tiene agendado hoy:</p>
        <p className="text-lg font-semibold">{agenda.map((z) => z.zoneName).join(' → ')}</p>
        <p>No elegiste <strong>{faltantes.map((z) => z.zoneName).join(' ni ')}</strong>. Sin esa zona, sus clientes no le aparecen al chofer en la hoja.</p>
      </Modal>}
    </Page>
  )
}
