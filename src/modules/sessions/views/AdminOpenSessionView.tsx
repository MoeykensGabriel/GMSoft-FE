import { useState } from 'react'
import { scheduleService } from '../../schedule'
import { SuggestedZoneNotice } from '../components/SuggestedZoneNotice'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ApiError, Button, ErrorMessage, Field, Modal, Page, PageHeader, Panel, Select, BackButton } from '../../core'
import { driverService } from '../../drivers'
import { zoneService } from '../../zones'
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
  const zonas = useQuery({ queryKey: ['zones', 'active'], queryFn: () => zoneService.listActive() })

  const [driverId, setDriverId] = useState('')
  const [chosenZone, setZoneId] = useState<string | null>(null)
  const suggestion = useQuery({
    queryKey: ['sessions', 'suggested-zone', { driverId }],
    queryFn: () => scheduleService.suggested(driverId),
    enabled: Boolean(driverId),
  })
  const zoneId = chosenZone ?? suggestion.data?.zoneId ?? ''
  const [kilometros, setKilometros] = useState('')

  const abrir = useMutation({
    mutationFn: (confirmOutsideWorkingHours: boolean) => sessionService.open({
      driverId, zoneId, kilometersAtOpen: Number(kilometros), confirmOutsideWorkingHours,
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
      <PageHeader title="Abrir salida" actions={<BackButton to="/panel/salidas" label="Volver a Salidas" />} />

      <Panel title="Salida en nombre de un chofer">
        <form className="flex max-w-md flex-col gap-4" onSubmit={(event) => { event.preventDefault(); abrir.mutate(false) }}>
          <ErrorMessage error={choferes.error ?? zonas.error} />

          <Select label="Chofer" name="driverId" required value={driverId} onChange={(e) => { setDriverId(e.target.value); setZoneId(null) }}>
            <option value="">Elegí un chofer</option>
            {conCamion.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName} · {c.vehicleName} ({c.vehicleLicensePlate})</option>
            ))}
          </Select>

          <Select label="Zona de reparto" name="zoneId" required value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
            <option value="">Elegí una zona</option>
            {zonas.data?.items.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </Select>

          <SuggestedZoneNotice suggestion={suggestion.data} zoneId={zoneId} />
          <Field label="Kilometraje del vehículo" name="kilometersAtOpen" type="number" min={0} inputMode="numeric" required
            value={kilometros} onChange={(e) => setKilometros(e.target.value)} />

          {!fueraDeHorario && <ErrorMessage error={abrir.error} />}

          <Button type="submit" className="self-start" disabled={abrir.isPending}>
            {abrir.isPending ? 'Abriendo...' : suggestion.data?.zoneId && zoneId !== suggestion.data.zoneId ? 'Guardar igual y abrir salida' : 'Abrir salida'}
          </Button>
        </form>
      </Panel>

      {fueraDeHorario && (
        <Modal title="Fuera del horario laboral" busy={abrir.isPending} onClose={() => abrir.reset()}
          footer={<>
            <Button type="button" variant="danger" disabled={abrir.isPending} onClick={() => abrir.reset()}>Cancelar</Button>
            <Button type="button" disabled={abrir.isPending} onClick={() => abrir.mutate(true)}>
              {abrir.isPending ? 'Abriendo...' : 'Abrir igual'}
            </Button>
          </>}>
          <p>{fueraDeHorario.detail?.replace(/^Fuera del horario laboral\.\s*/, '')}</p>
          <p className="text-muted">La salida va a quedar marcada como abierta fuera de horario.</p>
        </Modal>
      )}
    </Page>
  )
}
