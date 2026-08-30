import { api } from '../../core'
import type { PagedResult } from '../../core'

export interface Customer {
  id: string
  businessName: string | null
  contactName: string
  phone: string
  address: string
  email: string | null
  zoneId: string
  zoneName: string | null
  routeOrder: number
  notes: string | null
  isActive: boolean
  displayName: string
  lastPurchaseAt: string | null
  daysWithoutPurchase: number | null
  sinComprasRegistradas: boolean
}

export interface CustomerContainerLine {
  productId: string
  productDetail: string
  quantity: number
}

export interface CustomerUnitLine {
  containerUnitId: string
  productId: string
  productDetail: string
  serialNumber: string
}

export interface AccountMovement {
  date: string
  type: 'Delivery' | 'Payment'
  amount: number
  referenceId: string
  notes: string | null
}

export interface CustomerAccount {
  customerId: string
  displayName: string
  address: string
  phone: string
  zoneName: string | null
  balance: number
  lastPurchaseAt: string | null
  daysWithoutPurchase: number | null
  containers: CustomerContainerLine[]
  units: CustomerUnitLine[]
  movements: AccountMovement[]
}

export const customerService = {
  /**
   * La hoja de ruta: filtrado por zona, el backend devuelve los clientes en orden
   * de recorrido. Sin zona ese orden no significa nada.
   */
  listByZone: (zoneId: string, pageSize = 100) =>
    api.get<PagedResult<Customer>>(
      `/api/customers?zoneId=${zoneId}&onlyActive=true&pageSize=${pageSize}`,
    ),

  /** Cuanto debe y que envases tiene. Es lo que el chofer necesita en la puerta. */
  getAccount: (customerId: string) =>
    api.get<CustomerAccount>(`/api/customers/${customerId}/account`),
}
