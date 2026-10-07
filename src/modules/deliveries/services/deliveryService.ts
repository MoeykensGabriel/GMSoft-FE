import { api } from '../../core'

export type DeliveryType = 'Sale' | 'ContainerOnly'
export type PaymentMethod = 'Cash' | 'Transfer' | 'Card'

export interface NewCustomerLine {
  businessName: string | null
  contactName: string
  phone: string
  address: string
  notes: string | null
  visitDays: number[]
}

export interface RegisterDeliveryRequest {
  customerId: string | null
  newCustomer: NewCustomerLine | null
  type: DeliveryType
  items: { productId: string; quantity: number }[]
  containersOut: { productId: string; quantity: number }[]
  containersIn: { productId: string; quantity: number }[]
  /** Sin amount se cobra el total de la venta, que calcula el servidor. */
  payment: { method: PaymentMethod; amount?: number } | null
  notes: string | null
  /** Identifica la visita para que un reintento no la duplique. */
  clientRequestId: string
}

export interface RegisterDeliveryResult {
  deliveryId: string
  customerId: string
  total: number
  saldoCuentaCliente: number
}

export const deliveryService = {
  /** La sesion no viaja: el backend usa la que el chofer tiene abierta. */
  register: (body: RegisterDeliveryRequest) =>
    api.post<RegisterDeliveryResult>('/api/deliveries', body),
}
