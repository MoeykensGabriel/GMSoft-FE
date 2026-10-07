import { weekdayLabels, formatDateTime } from '../../core'
import type { Customer } from '../services/customerService'
import { purchaseActivityLabel } from '../utils/activity'

export function CustomerProfileCard({ customer }: { customer: Customer }) {
  const phone = customer.phone.replace(/[^+\d]/g, '')
  return <section className="flex flex-col gap-2 text-sm" aria-label="Datos del cliente">
    <h1 className="text-lg font-semibold break-words">{customer.displayName}</h1>
    {customer.businessName && <p>Contacto: {customer.contactName}</p>}
    <p className="break-words"><strong>Dirección:</strong> {customer.address}</p>
    <p><strong>Zona:</strong> {customer.zoneName ?? 'Sin nombre de zona'}</p>
    <p><strong>Teléfono:</strong> {phone ? <a className="inline-flex min-h-11 items-center underline" href={`tel:${phone}`}>{customer.phone}</a> : customer.phone || 'Sin teléfono'}</p>
    <p><strong>Días de visita:</strong> {customer.visitDays?.length ? weekdayLabels(customer.visitDays) : 'Pendientes de configurar por ADMIN'}</p>
    <p><strong>Camión:</strong> {customer.vehicleId ? `${customer.vehicleName} · ${customer.vehicleLicensePlate}` : 'Sin camión asignado'}</p>
    <p><strong>Última visita:</strong> {customer.lastVisitAt ? formatDateTime(customer.lastVisitAt, 'America/Argentina/Buenos_Aires') : 'Sin visitas registradas'}</p>
    {customer.notes && <p className="whitespace-pre-wrap break-words"><strong>Indicaciones:</strong> {customer.notes}</p>}
    <p>{purchaseActivityLabel(customer.weeksWithoutPurchase, customer.lastPurchaseAt === null)}</p>
  </section>
}
