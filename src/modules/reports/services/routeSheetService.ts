import { api } from '../../core'

export interface RouteSheetContainer { productId: string; productDetail: string; quantity: number }
export interface RouteSheetCustomer {
  customerId: string
  routeOrder: number
  displayName: string
  address: string
  /** Positivo es deuda del cliente. */
  balance: number
  containers: RouteSheetContainer[]
}
export interface RouteSheetZone { zoneId: string; zoneName: string; customers: RouteSheetCustomer[] }
export interface RouteSheet {
  vehicleId: string
  vehicleName: string
  licensePlate: string
  date: string
  zones: RouteSheetZone[]
}

export const routeSheetService = {
  get: (vehicleId: string, date: string) => api.get<RouteSheet>(
    `/api/reports/route-sheet?${new URLSearchParams({ vehicleId, date })}`,
  ),
}
