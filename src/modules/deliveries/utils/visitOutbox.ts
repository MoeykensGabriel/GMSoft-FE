import type { OutboxItem } from '../../core'
import type { RegisterDeliveryRequest } from '../services/deliveryService'

// Lo mismo que refresca una visita confirmada en el momento: salida actual, clientes y salidas.
const INVALIDATE: unknown[][] = [['session', 'current'], ['customers'], ['sessions']]

/** Una visita (venta, solo envases o «no compró») lista para la bandeja de salida. */
export function visitOutboxItem(input: {
  userId: string
  sessionId: string
  label: string
  body: RegisterDeliveryRequest
}): OutboxItem {
  return {
    id: input.body.clientRequestId,
    userId: input.userId,
    sessionId: input.sessionId,
    customerId: input.body.customerId,
    label: input.label,
    path: '/api/deliveries',
    body: input.body,
    invalidate: INVALIDATE,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
}
