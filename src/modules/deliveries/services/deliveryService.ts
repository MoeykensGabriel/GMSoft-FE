import { api } from '../../core'

export type DeliveryType = 'Sale' | 'ContainerOnly'
export type PaymentMethod = 'Cash' | 'Transfer' | 'Card'

export interface NewCustomerLine {
  businessName: string | null
  contactName: string
  phone: string
  address: string
  notes: string | null
}

export interface RegisterDeliveryRequest {
  customerId: string | null
  newCustomer: NewCustomerLine | null
  type: DeliveryType
  items: { productId: string; quantity: number }[]
  containersOut: { productId: string; quantity: number }[]
  containersIn: { productId: string; quantity: number }[]
  payment: { amount: number; method: PaymentMethod } | null
  notes: string | null
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
