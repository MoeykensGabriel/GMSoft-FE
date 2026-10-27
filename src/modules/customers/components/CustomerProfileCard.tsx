import { weekdayLabels, formatDateTime, LinkButton, WhatsAppButton } from '../../core'
import type { Customer } from '../services/customerService'
import { purchaseActivityLabel } from '../utils/activity'

/** Con editTo (solo la oficina) aparece el lápiz para editar al lado del nombre. */
export function CustomerProfileCard({ customer, headingLevel = 1, editTo }: { customer: Customer; headingLevel?: 1 | 2; editTo?: string }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  return <section className="ui-card flex flex-col gap-2 p-3 text-sm" aria-label="Datos del cliente">
    <div className="ui-section-heading -mx-3 -mt-3 mb-1 flex items-center justify-between gap-3">
      <Heading className="min-w-0 break-words">{customer.displayName}</Heading>
      {editTo && <LinkButton to={editTo} variant="edit" className="min-h-11 min-w-11 shrink-0 px-0" aria-label={`Editar cliente ${customer.displayName}`} title="Editar">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </LinkButton>}
    </div>
    {customer.businessName && <p>Contacto: {customer.contactName}</p>}
    <p className="break-words"><strong>Dirección:</strong> {customer.address}</p>
    <p><strong>Zona:</strong> {customer.zoneName ?? 'Sin nombre de zona'}</p>
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2"><p><strong>Teléfono:</strong> {customer.phone || 'Sin teléfono'}</p>
      {customer.phone && <WhatsAppButton phone={customer.phone} name={customer.displayName} className="min-h-11" />}</div>
    <p><strong>Días de visita:</strong> {customer.visitDays?.length ? weekdayLabels(customer.visitDays) : 'Pendientes de configurar por ADMIN'}</p>
    <p><strong>Camión:</strong> {customer.vehicleId ? `${customer.vehicleName} · ${customer.vehicleLicensePlate}` : 'Sin camión asignado'}</p>
    <p><strong>Última visita:</strong> {customer.lastVisitAt ? formatDateTime(customer.lastVisitAt, 'America/Argentina/Buenos_Aires') : 'Sin visitas registradas'}</p>
    {customer.notes && <p className="whitespace-pre-wrap break-words"><strong>Indicaciones:</strong> {customer.notes}</p>}
    <p>{purchaseActivityLabel(customer.weeksWithoutPurchase, customer.lastPurchaseAt === null)}</p>
  </section>
}
