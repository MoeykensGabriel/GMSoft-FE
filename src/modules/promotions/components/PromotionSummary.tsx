import { Badge, weekdayLabels } from '../../core'
import type { Promotion, Prospect } from '../services/promotionService'
import { pickupLabel } from '../utils/promotion'

export function ProspectSummary({ prospect }: { prospect: Prospect }) {
  return <div className="flex flex-col gap-1 break-words text-sm">
    <p className="font-semibold">{prospect.contactName}</p>
    {prospect.businessName && <p>{prospect.businessName}</p>}
    <p>{prospect.address}</p><p>Teléfono: {prospect.phone}</p>
    <p>Días de visita: {weekdayLabels(prospect.visitDays)}</p>
    {prospect.notes && <p>Observaciones: {prospect.notes}</p>}
  </div>
}
export function PromotionBadge({ promotion }: { promotion: Promotion }) {
  if (promotion.status === 'Converted') return <Badge tone="success">Convertida</Badge>
  if (promotion.status === 'NotConverted') return <Badge>No convertida</Badge>
  if (promotion.isOverdue || promotion.status === 'Overdue') return <Badge tone="danger">Vencida</Badge>
  if (promotion.isDueToday) return <Badge tone="warning">Pendiente · Retirar hoy</Badge>
  return <Badge tone="info">Pendiente</Badge>
}
export function PromotionSummary({ promotion }: { promotion: Promotion }) {
  return <div className="flex flex-col gap-3">
    <ProspectSummary prospect={promotion.prospect} />
    <div><PromotionBadge promotion={promotion} /> <span className="text-sm">Retiro: {pickupLabel(promotion.pickupDate)}</span></div>
    <ul className="flex flex-col gap-2 text-sm">{promotion.lines.map((line) => <li key={line.productId}>
      {line.quantity} × {line.productDetail} · {line.containersLoaned} envases prestados
    </li>)}</ul>
  </div>
}
