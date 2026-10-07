import { BUSINESS_TIME_ZONE, Button, ErrorMessage, Modal, formatDateTime, weekdayLabels } from '../../core'

export interface LoadConfirmLine {
  productId: string
  productDetail: string
  /** Lo que sube en esta tanda: es exactamente lo que se envia. */
  quantity: number
  /** Lo que queda arriba del camion sumando lo que ya tenia. */
  totalOnBoard: number
}

interface Props {
  vehicleName: string
  licensePlate: string
  driverNames: string[]
  routeDays: number[]
  lines: LoadConfirmLine[]
  /** Cuando se abrio el resumen. La hora definitiva la pone el servidor al confirmar. */
  openedAt: Date
  sending: boolean
  error: unknown
  onBack: () => void
  onConfirm: () => void
}

/**
 * El ultimo vistazo antes de registrar la carga. Abrirlo o volver a editar no
 * registra nada ni toca el stock: recien confirma el boton verde.
 */
export function LoadConfirmModal({
  vehicleName, licensePlate, driverNames, routeDays, lines, openedAt, sending, error, onBack, onConfirm,
}: Props) {
  const yaTeniaCarga = lines.some((line) => line.totalOnBoard !== line.quantity)

  return (
    <Modal
      title="Confirmar carga del camión"
      onClose={onBack}
      busy={sending}
      footer={<>
        <Button type="button" variant="danger" disabled={sending} onClick={onBack}>Volver a editar</Button>
        <Button type="button" disabled={sending} onClick={onConfirm}>
          {sending ? 'Registrando...' : 'Confirmar carga'}
        </Button>
      </>}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-neutral-600">Camión</dt>
        <dd className="font-medium text-neutral-900">{vehicleName} · {licensePlate}</dd>
        <dt className="text-neutral-600">Chofer</dt>
        <dd className="font-medium text-neutral-900">
          {driverNames.length ? driverNames.join(', ') : 'Sin chofer activo asignado'}
        </dd>
        <dt className="text-neutral-600">Días</dt>
        <dd className="font-medium text-neutral-900">{weekdayLabels(routeDays)}</dd>
        <dt className="text-neutral-600">Fecha y hora</dt>
        <dd className="font-medium text-neutral-900">{formatDateTime(openedAt, BUSINESS_TIME_ZONE)}</dd>
      </dl>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-900 text-left">
            <th className="py-1 font-semibold">Producto</th>
            <th className="py-1 text-right font-semibold">Se carga</th>
            {yaTeniaCarga && <th className="py-1 text-right font-semibold">Queda arriba</th>}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.productId} className="border-b border-neutral-200">
              <td className="py-1">{line.productDetail}</td>
              <td className="py-1 text-right">{line.quantity}</td>
              {yaTeniaCarga && <td className="py-1 text-right">{line.totalOnBoard}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-neutral-600">
        La hora definitiva la registra el sistema al confirmar. La salida la abre el chofer con
        su zona y kilometraje.
      </p>

      <ErrorMessage error={error} />
    </Modal>
  )
}
