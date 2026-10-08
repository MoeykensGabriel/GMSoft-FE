export interface RouteFilters {
  vehicleId: string
  zoneId: string
  day: number
}

export interface RouteCustomer {
  id: string
  displayName: string
  address: string
  phone: string
  zoneId: string
  zoneName: string | null
  routeOrder: number
  visitDays: number[]
  vehicleId: string
  vehicleName: string | null
  vehicleLicensePlate: string | null
}

export interface RouteSnapshot {
  items: RouteCustomer[]
  version: string
}

export interface RouteChange {
  id: string
  visitDays?: number[]
  vehicleId?: string
}

export interface RouteSave extends RouteFilters {
  version: string
  customerIds: string[]
  changes: RouteChange[]
}
