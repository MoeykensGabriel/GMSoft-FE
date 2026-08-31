import { api } from '../../core'
import type { PagedResult } from '../../core'

export type VehicleType = 'Motorcycle' | 'Car' | 'Pickup' | 'Van' | 'Truck'

export interface Vehicle {
  id: string
  name: string
  licensePlate: string
  type: VehicleType
  currentKilometers: number
}

export const vehicleService = {
  list: (pageSize = 100) => api.get<PagedResult<Vehicle>>(`/api/vehicles?pageSize=${pageSize}`),
}
