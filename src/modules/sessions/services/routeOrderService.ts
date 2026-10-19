import { api } from '../../core'

export interface DriverRouteCustomer { id: string; displayName: string; address: string }
export interface DriverRouteSnapshot { items: DriverRouteCustomer[]; version: string }
export interface RouteOrderChange { changedAt: string; changedByUserName: string | null; movedCount: number }

export const routeOrderService = {
  get: (id: string) => api.get<DriverRouteSnapshot>(`/api/sessions/${id}/route-order`),
  save: (id: string, customerIds: string[], version: string) =>
    api.put<DriverRouteSnapshot>(`/api/sessions/${id}/route-order`, { customerIds, version }),
}
