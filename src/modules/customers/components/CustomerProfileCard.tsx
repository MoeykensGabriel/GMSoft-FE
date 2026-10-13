import { weekdayLabels, formatDateTime, WhatsAppButton } from '../../core'
import type { Customer } from '../services/customerService'
import { purchaseActivityLabel } from '../utils/activity'

export function CustomerProfileCard({ customer }: { customer: Customer }) {
  return <section className="ui-card flex flex-col gap-2 p-3 text-sm" aria-label="Datos del cliente">
    <h1 className="ui-section-heading -mx-3 -mt-3 mb-1 break-words">{customer.displayName}</h1>
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
