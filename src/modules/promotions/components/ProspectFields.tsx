import { Textarea } from '../../core'
import { NewCustomerFields } from '../../deliveries'
import type { Prospect } from '../services/promotionService'

export function ProspectFields({ value, onChange }: { value: Prospect; onChange: (value: Prospect) => void }) {
  return <>
    <NewCustomerFields title="Datos del prospecto" valor={value} onChange={onChange} />
    <Textarea label="Observaciones (opcional)" maxLength={1000} value={value.notes ?? ''}
      onChange={(event) => onChange({ ...value, notes: event.target.value || null })} />
  </>
}
