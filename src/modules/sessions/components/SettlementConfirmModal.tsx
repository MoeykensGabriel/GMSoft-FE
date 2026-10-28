import { Button, ErrorMessage, Modal, StatTile, formatMoney } from '../../core'
import { cashGap, cashGapDetail } from '../utils/receptionSummary'

interface Props {
  driverName: string
  /** Efectivo que cobró el chofer. Sin dato si todavía no se pudo consultar. */
  cashCollected?: number
  amount: number
  sending: boolean
  error: unknown
  onBack: () => void
  onConfirm: () => void
}

/**
 * El último vistazo antes de rendir. La rendición se carga una sola vez: un monto mal
 * escrito después solo se arregla con una corrección, así que acá se ve la diferencia de
 * caja que va a quedar antes de registrarla.
 */
export function SettlementConfirmModal({ driverName, cashCollected, amount, sending, error, onBack, onConfirm }: Props) {
  const difference = cashCollected === undefined ? null : cashGap(cashCollected, amount)

  return (
    <Modal title="Confirmar rendición" onClose={onBack} busy={sending} footer={<>
      <Button type="button" variant="danger" disabled={sending} onClick={onBack}>Volver a editar</Button>
      <Button type="button" disabled={sending} onClick={onConfirm}>{sending ? 'Registrando...' : 'Confirmar rendición'}</Button>
    </>}>
      <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1">
        <dt className="text-muted">Chofer</dt>
        <dd className="font-medium text-ink">{driverName}</dd>
        <dt className="text-muted">Efectivo cobrado</dt>
        <dd className="font-medium text-ink">{cashCollected === undefined ? 'No disponible' : formatMoney(cashCollected)}</dd>
        <dt className="text-muted">Entrega</dt>
        <dd className="text-2xl font-semibold text-ink">{formatMoney(amount)}</dd>
      </dl>

      {difference === null
        ? <p className="text-muted">No se pudo consultar el efectivo cobrado: la diferencia de caja se ve después de registrar.</p>
        : <StatTile label="Diferencia de caja" value={formatMoney(Math.abs(difference))}
          tone={difference === 0 ? 'success' : 'danger'} detail={cashGapDetail(difference)} />}

      <p>La rendición se registra una sola vez. Si el monto está mal, después solo se arregla con «Corregir recepción» y el cambio queda en la salida.</p>
      <ErrorMessage error={error} />
    </Modal>
  )
}
