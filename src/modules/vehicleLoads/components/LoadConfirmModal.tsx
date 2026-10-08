import { BUSINESS_TIME_ZONE, Button, ErrorMessage, Modal, formatDateTime, weekdayLabels, DataTable } from '../../core'

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
  restock?: boolean
  notes?: string | null
  backDisabled?: boolean
  notice?: string
}

/**
 * El ultimo vistazo antes de registrar la carga. Abrirlo o volver a editar no
 * registra nada ni toca el stock: recien confirma el boton verde.
 */
export function LoadConfirmModal({
  vehicleName, licensePlate, driverNames, routeDays, lines, openedAt, sending, error, onBack, onConfirm,
  restock = false, notes, backDisabled = false, notice,
}: Props) {
  const yaTeniaCarga = lines.some((line) => line.totalOnBoard !== line.quantity)

  return (
    <Modal
      title={restock ? 'Confirmar recarga en ruta' : 'Confirmar carga del camión'}
      onClose={() => { if (!backDisabled) onBack() }}
      busy={sending}
      footer={<>
        <Button type="button" variant="danger" disabled={sending || backDisabled} onClick={onBack}>Volver a editar</Button>
        <Button type="button" disabled={sending} onClick={onConfirm}>
          {sending ? 'Registrando...' : restock ? 'Confirmar recarga' : 'Confirmar carga'}
        </Button>
      </>}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-muted">Camión</dt>
        <dd className="font-medium text-ink">{vehicleName} · {licensePlate}</dd>
        <dt className="text-muted">Chofer</dt>
        <dd className="font-medium text-ink">
          {driverNames.length ? driverNames.join(', ') : 'Sin chofer activo asignado'}
        </dd>
        <dt className="text-muted">Días</dt>
        <dd className="font-medium text-ink">{weekdayLabels(routeDays)}</dd>
        <dt className="text-muted">Fecha y hora</dt>
        <dd className="font-medium text-ink">{formatDateTime(openedAt, BUSINESS_TIME_ZONE)}</dd>
      </dl>

      <DataTable label={restock ? 'Productos de la recarga a confirmar' : 'Productos de la carga a confirmar'} className="w-full">
        <thead>
          <tr className="border-b border-brand text-left">
            <th scope="col" className="py-1 font-semibold">Producto</th>
            <th scope="col" className="py-1 text-right font-semibold">Se carga</th>
            {yaTeniaCarga && <th scope="col" className="py-1 text-right font-semibold">Queda arriba</th>}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.productId} className="border-b border-line">
              <td className="py-1">{line.productDetail}</td>
              <td className="py-1 text-right">{line.quantity}</td>
              {yaTeniaCarga && <td className="py-1 text-right">{line.totalOnBoard}</td>}
            </tr>
          ))}
        </tbody>
      </DataTable>

      {notes && <p className="whitespace-pre-wrap break-words">Notas: {notes}</p>}
      <p className="text-muted">
        La fecha y hora mostradas son de referencia. La hora definitiva la registra el sistema al confirmar.
        {!restock && ' La salida la abre el chofer con su zona y kilometraje.'}
      </p>
      {restock && <p>Una recarga confirmada no se puede anular. Un error se corrige en la recepción final.</p>}
      {notice && <p role="status">{notice}</p>}

      <ErrorMessage error={error} />
    </Modal>
  )
}
