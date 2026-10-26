import type { LastNoPurchase, NoPurchaseReason } from '../utils/noPurchase'
import { api } from '../../core'
import type { PagedResult } from '../../core'
import type { RemovalReason, RemovalStatus } from '../utils/removal'

export interface OutOfRouteCustomer {
  id: string
  name: string
  address: string
  zoneId: string
  zoneName: string
  visitDays: number[]
}

export interface Customer {
  id: string
  businessName: string | null
  contactName: string
  phone: string
  address: string
  email: string | null
  zoneId: string
  zoneName: string | null
  vehicleId: string | null
  vehicleName: string | null
  vehicleLicensePlate: string | null
  lastVisitAt: string | null
  routeOrder: number
  visitDays: number[] | null
  activityStatus: 'White' | 'Red' | 'Black'
  /** Semanas en que paso el camion y no compro. No son semanas de calendario. */
  weeksWithoutPurchase: number
  notes: string | null
  isActive: boolean
  displayName: string
  lastNoPurchase: LastNoPurchase | null
  lastPurchaseAt: string | null
  daysWithoutPurchase: number | null
  sinComprasRegistradas: boolean
  /** El chofer pidió la baja y la oficina todavía no la resolvió. */
  removalPending?: boolean
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

export interface CustomerStatementEntry {
  date: string
  kind: 'Sale' | 'ContainerOnly' | 'Promotion' | 'NoPurchase' | 'Payment' | 'ContainerAdjustment' | 'ContainerLoss'
    | 'RemovalRequested' | 'RemovalConfirmed' | 'RemovalRejected'
    | 'Loan' | 'LoanReturn'
  referenceId: string
  lines: (CustomerContainerLine & { unitPrice: number; amount: number })[]
  containersDelivered: CustomerContainerLine[]
  containersReturned: CustomerContainerLine[]
  containerExchanges: (CustomerContainerLine & { notes: string | null })[]
  containerChanges: (CustomerContainerLine & { reason: string | null })[]
  charge: number
  payments: { amount: number; method: 'Cash' | 'Transfer' | 'Card' }[]
  paid: number
  noPurchaseReason: NoPurchaseReason | null
  removalReason?: RemovalReason | null
  notes: string | null
  balanceAfter: number
}

export interface CustomerAccount {
  customerId: string
  displayName: string
  address: string
  phone: string
  zoneName: string | null
  balance: number
  lastNoPurchase: LastNoPurchase | null
  lastPurchaseAt: string | null
  daysWithoutPurchase: number | null
  weeksWithoutPurchase: number
  containers: CustomerContainerLine[]
  units: CustomerUnitLine[]
  statement: CustomerStatementEntry[]
  statementTotalCount: number
}

export interface CustomerInput {
  businessName: string | null
  contactName: string
  phone: string
  address: string
  email: string | null
  zoneId: string
  notes: string | null
  visitDays: number[]
  vehicleId: string
  isActive: boolean
}

/** Umbrales de actividad; isDefault mientras ADMIN no guardó los suyos. */
export interface ActivitySettings {
  redAfterMissedWeeks: number
  blackAfterMissedWeeks: number
  isDefault: boolean
}

/** Baja pedida por el chofer. Ver GM-SoftBE/docs/customer-removal.md. */
export interface CustomerRemoval {
  id: string
  customerId: string
  customerName: string
  vehicleId: string
  vehicleName: string
  zoneId: string
  zoneName: string
  driverId: string
  driverName: string
  requestedAt: string
  status: RemovalStatus
  reason: RemovalReason
  notes: string | null
  containersNotReturned: boolean
  containers: CustomerContainerLine[]
  debt: number
  resolvedAt: string | null
  clientRequestId: string
}

export interface CustomerRemovalPage {
  items: CustomerRemoval[]
  totalCount: number
  pendingCount: number
  page: number
  pageSize: number
}

export interface RemovalRequestInput {
  clientRequestId: string
  reason: RemovalReason
  notes: string | null
  containersNotReturned: boolean
}

export const customerService = {
  searchOutOfRoute: (search: string) =>
    api.get<OutOfRouteCustomer[]>(`/api/customers/out-of-route?search=${encodeURIComponent(search.trim())}`),
  listRoute: async (zones: { zoneId: string }[], routeDays: number[], vehicleId: string, search = ''): Promise<Customer[]> => {
    const blocks = await Promise.all(zones.map(async ({ zoneId }) => {
      const items: Customer[] = []
      let page = 1
      while (true) {
        const result = await customerService.listByZone(zoneId, 100, page, routeDays, search, vehicleId)
        items.push(...result.items)
        if (!result.hasNextPage) return items
        page++
      }
    }))
    return blocks.flat()
  },
  requestRemoval: (customerId: string, body: RemovalRequestInput) =>
    api.post<CustomerRemoval>(`/api/customers/${customerId}/removal-requests`, body),
  removals: (status: RemovalStatus | null, page = 1, vehicleId = '') =>
    api.get<CustomerRemovalPage>(`/api/customers/removal-requests?page=${page}&pageSize=20${status ? `&status=${status}` : ''}${vehicleId ? `&vehicleId=${encodeURIComponent(vehicleId)}` : ''}`),
  /** Confirma todas las bajas pendientes del camión; falla si no son exactamente `expectedCount`. */
  confirmVehicleRemovals: (vehicleId: string, expectedCount: number) =>
    api.post<number>('/api/customers/removal-requests/confirm-vehicle', { vehicleId, expectedCount }),
  confirmRemoval: (requestId: string) => api.post<CustomerRemoval>(`/api/customers/removal-requests/${requestId}/confirm`, {}),
  rejectRemoval: (requestId: string) => api.post<CustomerRemoval>(`/api/customers/removal-requests/${requestId}/reject`, {}),

  activitySettings: () => api.get<ActivitySettings>('/api/customer-activity/settings'),
  saveActivitySettings: (redAfterMissedWeeks: number, blackAfterMissedWeeks: number) =>
    api.put<ActivitySettings>('/api/customer-activity/settings', { redAfterMissedWeeks, blackAfterMissedWeeks }),

  /** Vista de la oficina: los clientes que un camión visita un día de la semana (ISO 1–7). */
  /** Clientes de un camión; el día de visita es opcional. */
  listByVehicle: (vehicleId: string, visitDay: number | null, page = 1, search = '') =>
    api.get<PagedResult<Customer>>(
      `/api/customers?vehicleId=${vehicleId}${visitDay === null ? '' : `&visitDays=${visitDay}`}&page=${page}&pageSize=20&search=${encodeURIComponent(search)}`,
    ),
  create: (input: CustomerInput) => api.post<string>('/api/customers', input),
  update: (id: string, input: CustomerInput) => api.put<void>(`/api/customers/${id}`, { ...input, id, routeOrder: null }),
  getPrices: (customerId: string) =>
    api.get<{ productId: string; price: number }[]>(`/api/customers/${customerId}/prices`),
  /**
   * La hoja de ruta: filtrado por zona, el backend devuelve los clientes en orden
   * de recorrido. Sin zona ese orden no significa nada.
   */
  listByZone: (zoneId: string, pageSize = 100, page = 1, routeDays?: number[], search = '', vehicleId?: string) =>
    api.get<PagedResult<Customer>>(
      `/api/customers?vehicleId=${vehicleId ?? ''}&zoneId=${zoneId}&onlyActive=true&pageSize=${pageSize}&page=${page}&search=${encodeURIComponent(search)}&${routeDays?.length ? routeDays.map((day) => `visitDays=${day}`).join('&') : 'todayOnly=true'}`,
    ),

  /** Cuanto debe y que envases tiene. Es lo que el chofer necesita en la puerta. */
  getAccount: (customerId: string) =>
    api.get<CustomerAccount>(`/api/customers/${customerId}/account`),
  getById: (customerId: string) => api.get<Customer>(`/api/customers/${customerId}`),
}
