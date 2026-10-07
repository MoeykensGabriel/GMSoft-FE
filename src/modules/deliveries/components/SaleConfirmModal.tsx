import { Button, Modal, Select, formatMoney } from '../../core'
import type { PaymentMethod } from '../services/deliveryService'

export type Cobro = 'cobrada' | 'deuda'

export interface SaleConfirmLine {
  productId: string
  productDetail: string
  quantity: number
  subtotal: number
}

interface Props {
  lines: SaleConfirmLine[]
  total: number
  /** Null hasta que el chofer elige: no hay opcion por defecto a proposito. */
  cobro: Cobro | null
  metodo: PaymentMethod
  onCobro: (cobro: Cobro) => void
  onMetodo: (metodo: PaymentMethod) => void
  sending: boolean
  error: string | null
  onBack: () => void
  onConfirm: () => void
}

const METODOS: Record<PaymentMethod, string> = {
  Cash: 'efectivo',
  Transfer: 'transferencia',
  Card: 'tarjeta',
}

/**
 * La unica pregunta de la venta: si la cobro o queda a deuda. El importe no se
 * escribe: es el total de esta venta y lo fija el servidor. No cobra deuda anterior.
 */
export function SaleConfirmModal({
  lines, total, cobro, metodo, onCobro, onMetodo, sending, error, onBack, onConfirm,
}: Props) {
  const opcion = (valor: Cobro, texto: string) => (
    <Button
      type="button"
      variant={cobro === valor ? 'navigation' : 'secondary'}
      aria-pressed={cobro === valor}
      disabled={sending}
      onClick={() => onCobro(valor)}
      className="min-h-11 flex-1 text-base"
    >
      {texto}
    </Button>
  )

  return (
    <Modal
      title="Confirmar venta"
      onClose={onBack}
      busy={sending}
      footer={<>
        <Button type="button" variant="danger" disabled={sending} onClick={onBack}>Volver</Button>
        <Button type="button" disabled={sending || cobro === null} onClick={onConfirm}>
          {sending ? 'Registrando...' : 'Confirmar venta'}
        </Button>
      </>}
    >
      <ul className="flex flex-col gap-1 text-sm">
        {lines.map((line) => (
          <li key={line.productId} className="flex justify-between gap-3">
            <span>{line.quantity} × {line.productDetail}</span>
            <span>{formatMoney(line.subtotal)}</span>
          </li>
        ))}
      </ul>

      <div className="flex justify-between rounded border-2 border-brand p-3 text-lg font-semibold">
        <span>Total a cobrar</span><span>{formatMoney(total)}</span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted">¿Cobraste esta venta?</span>
        <div className="flex gap-2">
          {opcion('cobrada', 'Sí, cobré')}
          {opcion('deuda', 'No, queda a deuda')}
        </div>
      </div>

      {cobro === 'cobrada' && (
        <Select
          label="Forma de pago"
          name="metodo"
          value={metodo}
          disabled={sending}
          onChange={(e) => onMetodo(e.target.value as PaymentMethod)}
        >
          <option value="Cash">Efectivo</option>
          <option value="Transfer">Transferencia</option>
          <option value="Card">Tarjeta</option>
        </Select>
      )}

      {/* La eleccion escrita entera antes de confirmar: registrar como cobrada una
          venta a deuda es el error que esta pantalla tiene que evitar. */}
      <p role="status" className="ui-card p-3 text-sm font-medium text-ink">
        {cobro === null && 'Elegí si la cobraste o queda a deuda.'}
        {cobro === 'cobrada' && `Se registra COBRADA: ${formatMoney(total)} en ${METODOS[metodo]}.`}
        {cobro === 'deuda' && `Se registra A DEUDA: ${formatMoney(total)} quedan en la cuenta del cliente.`}
      </p>

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </Modal>
  )
}
