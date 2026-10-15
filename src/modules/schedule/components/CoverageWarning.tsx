import { Button, Modal } from '../../core'
import type { Coverage } from '../services/scheduleService'
import { coverageMessage, coverageOptions } from '../utils/coverage'

export interface CoverageWarningItem { id: string; name: string; coverage?: Coverage }
export function CoverageWarning({ items, onZone, onContinue, onClose, busy = false, customer = false }: {
  items: CoverageWarningItem[]; onZone: (id: string, zoneId: string, zoneName: string) => void
  onContinue: () => void; onClose: () => void; busy?: boolean; customer?: boolean
}) {
  return <Modal title="Revisá la cobertura del recorrido" busy={busy} onClose={onClose} footer={<>
    <Button variant="danger" disabled={busy} onClick={onClose}>Volver a editar</Button>
    <Button disabled={busy} onClick={onContinue}>Guardar igual</Button>
  </>}>
    <p>La agenda es una guía. Podés guardar aunque no coincida.</p>
    {items.map((item) => <div key={item.id} className="rounded border border-warning/40 bg-warning-soft p-3 text-warning">
      <p className="font-semibold">{item.name}</p>
      <p>{item.coverage ? coverageMessage(item.coverage) : 'No se pudo consultar la agenda. Podés guardar igual o volver a intentar.'}</p>
      <div className="mt-3 flex flex-wrap gap-2">{item.coverage && coverageOptions(item.coverage).map((day) =>
        <Button key={day.scheduledZoneId} variant="secondary" disabled={busy} onClick={() => onZone(item.id, day.scheduledZoneId!, day.scheduledZoneName ?? 'Zona de la agenda')}>
          {customer ? 'Usar la zona de la agenda' : 'Cambiar a esa zona'}: {day.scheduledZoneName}
        </Button>)}</div>
    </div>)}
  </Modal>
}
