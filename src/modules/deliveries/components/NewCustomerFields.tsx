import { Field, WeekdaysField } from '../../core'
import type { NewCustomerLine } from '../services/deliveryService'

interface Props {
  valor: NewCustomerLine
  onChange: (valor: NewCustomerLine) => void
}

/**
 * Alta en la puerta. La zona y el lugar en el recorrido no se piden: los pone el
 * backend desde la sesion, asi el cliente nuevo queda en la zona que se esta
 * repartiendo y al final de ese recorrido.
 */
export function NewCustomerFields({ valor, onChange }: Props) {
  const set = (campo: 'businessName' | 'notes', v: string) =>
    onChange({ ...valor, [campo]: v === '' ? null : v })

  return (
    <div className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-white p-3">
      <span className="text-sm font-medium text-neutral-700">Cliente nuevo</span>

      <Field
        label="Nombre de contacto"
        name="contactName"
        required
        value={valor.contactName}
        onChange={(e) => onChange({ ...valor, contactName: e.target.value })}
      />
      <Field
        label="Razón social (opcional)"
        name="businessName"
        value={valor.businessName ?? ''}
        onChange={(e) => set('businessName', e.target.value)}
      />
      <Field
        label="Teléfono"
        name="phone"
        required
        value={valor.phone}
        onChange={(e) => onChange({ ...valor, phone: e.target.value })}
      />
      <Field
        label="Dirección"
        name="address"
        required
        value={valor.address}
        onChange={(e) => onChange({ ...valor, address: e.target.value })}
      />
      <WeekdaysField label="Días de visita" value={valor.visitDays} onChange={(visitDays) => onChange({ ...valor, visitDays })} />
      {!valor.visitDays.length && <p role="alert" className="text-sm text-red-700">Seleccioná al menos un día de visita.</p>}
    </div>
  )
}
