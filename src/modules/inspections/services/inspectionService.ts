import { api } from '../../core'
import type { PagedResult } from '../../core'
import type { NoPurchaseReason } from '../../customers'

export type NotBuyingReason = 'BuysElsewhere' | 'Moved' | 'DoesNotWant' | 'Other'
export type DeliveryType = 'Sale' | 'ContainerOnly' | 'Promotion' | 'NoPurchase'

export interface InspectionDeparture {
  sessionId: string
  vehicleName: string
  licensePlate: string
  driverName: string
  openedAt: string
  zones: string[]
}

export interface InspectionCount { productId: string; systemQuantity: number; realQuantity: number }

export interface InspectionCustomer {
  id: string
  displayName: string
  address: string
  notes: string | null
  zoneName: string
  routeOrder: number
  lastPurchaseAt: string | null
  weeksWithoutPurchase: number
  activityStatus: 'White' | 'Red' | 'Black'
  purchaseConfirmedAt: string | null
  /** Lo que marcó el chofer en esta salida; nulo si todavía no pasó. */
  driverVisit: { type: DeliveryType; noPurchaseReason: NoPurchaseReason | null; at: string } | null
  containers: { productId: string; product: string; quantity: number }[]
  inspection: { stillBuys: boolean; notBuyingReason: NotBuyingReason | null; notes: string | null; at: string; containers: InspectionCount[] } | null
}

export interface InspectionRoute { departure: InspectionDeparture; customers: InspectionCustomer[] }

export interface SaveInspectionInput {
  containers: { productId: string; realQuantity: number }[]
  stillBuys: boolean
  notBuyingReason: NotBuyingReason | null
  notes: string | null
}

/** Un control visto desde la oficina. */
export interface InspectionReportItem {
  id: string
  sessionId: string
  sessionOpenedAt: string
  routeOrder: number
  inspectedAt: string
  inspectorName: string
  vehicleName: string
  licensePlate: string
  driverName: string
  customerId: string
  customerName: string
  address: string
  zoneName: string
  driverVisit: InspectionCustomer['driverVisit']
  stillBuys: boolean
  notBuyingReason: NotBuyingReason | null
  notes: string | null
  containers: { product: string; systemQuantity: number; realQuantity: number }[]
}

export const inspectionService = {
  report: (filters: { inspectorId: string; vehicleId: string; page: number }) => api.get<PagedResult<InspectionReportItem>>(
    `/api/reports/inspections?page=${filters.page}&pageSize=20`
    + (filters.inspectorId ? `&inspectorId=${filters.inspectorId}` : '')
    + (filters.vehicleId ? `&vehicleId=${filters.vehicleId}` : '')),
  departures: () => api.get<InspectionDeparture[]>('/api/inspections/departures'),
  route: (sessionId: string) => api.get<InspectionRoute>(`/api/inspections/departures/${sessionId}`),
  save: (sessionId: string, customerId: string, input: SaveInspectionInput) =>
    api.put<InspectionCustomer>(`/api/inspections/departures/${sessionId}/customers/${customerId}`, input),
}
