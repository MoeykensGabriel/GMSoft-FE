import { Field, Select } from '../../core'
import type { PaymentMethod } from '../services/deliveryService'

interface Props {
  monto: string
  metodo: PaymentMethod
  onMonto: (v: string) => void
  onMetodo: (v: PaymentMethod) => void
}

/**
 * El cobro es opcional: se vende a cuenta todos los dias. Dejarlo vacio no es un
 * error, es la mitad del negocio.
 */
export function PaymentFields({ monto, metodo, onMonto, onMetodo }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-slate-700">Cobro (opcional)</span>

      <Field
        label="Monto"
        name="monto"
        type="number"
        min={0}
        step="0.01"
        inputMode="decimal"
        placeholder="Dejar vacío si no cobró"
        value={monto}
        onChange={(e) => onMonto(e.target.value)}
      />

      <Select
        label="Forma de pago"
        name="metodo"
        value={metodo}
        onChange={(e) => onMetodo(e.target.value as PaymentMethod)}
      >
        <option value="Cash">Efectivo</option>
        <option value="Transfer">Transferencia</option>
        <option value="Card">Tarjeta</option>
      </Select>
    </div>
  )
}
