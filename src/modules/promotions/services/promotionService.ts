import { api } from '../../core'
import type { PagedResult } from '../../core'

export interface Prospect {
  businessName: string | null
  contactName: string
  phone: string
  address: string
  notes: string | null
  visitDays: number[]
}
export type PromotionStatus = 'Pending' | 'Overdue' | 'Converted' | 'NotConverted'
export interface PromotionLine {
  productId: string
  productDetail: string
  quantity: number
  containersLoaned: number
  containersReturned: number
  containersLost: number
}
export interface Promotion {
  id: string
  vehicleId: string
  vehicleName: string
  vehicleLicensePlate: string
  driverId: string
  driverName: string
  deliverySessionId: string
  zoneId: string
  registeredAt: string
  pickupDate: string
  status: PromotionStatus
  isOverdue: boolean
  isDueToday: boolean
  prospect: Prospect
  lines: PromotionLine[]
  customerId: string | null
  closedAt: string | null
  closingSessionId: string | null
  closedByDriverId: string | null
  clientRequestId: string
  closeClientRequestId: string | null
}
export interface PromotionResult {
  promotionId: string
  customerId: string | null
  status: Exclude<PromotionStatus, 'Overdue'>
  registeredAt: string
  pickupDate: string
  closedAt: string | null
}
export interface RegisterPromotion {
  clientRequestId: string
  prospect: Prospect
  items: { productId: string; quantity: number }[]
}
export interface ClosePromotion {
  clientRequestId: string
  convertToCustomer: boolean
  customer: Prospect | null
  containersReturned: { productId: string; quantity: number }[]
}
export interface PromotionFilters {
  status: PromotionStatus | ''
  vehicleId: string
  from: string
  to: string
}
export const promotionService = {
  register: (body: RegisterPromotion) => api.post<PromotionResult>('/api/promotions', body),
  pending: () => api.get<Promotion[]>('/api/promotions/pending'),
  close: (id: string, body: ClosePromotion) => api.post<PromotionResult>(`/api/promotions/${encodeURIComponent(id)}/close`, body),
  list: (filters: PromotionFilters, page: number) => {
    const params = new URLSearchParams({ page: String(page), pageSize: '20' })
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value) })
    return api.get<PagedResult<Promotion>>(`/api/promotions?${params}`)
  },
  getById: (id: string) => api.get<Promotion>(`/api/promotions/${encodeURIComponent(id)}`),
  settings: () => api.get<{ pickupDays: number }>('/api/promotions/settings'),
  saveSettings: (pickupDays: number) => api.put<{ pickupDays: number }>('/api/promotions/settings', { pickupDays }),
}
