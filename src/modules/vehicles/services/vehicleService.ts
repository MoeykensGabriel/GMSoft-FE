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

/**
 * Una carga puesta arriba del camion y todavia sin salir. Va linea por linea y no
 * sumada por producto porque cada una se baja por separado: la oficina carga en
 * varias tandas y se equivoca en una sola.
 */
export interface VehicleLoadLine {
  id: string
  productId: string
  productDetail: string
  quantity: number
  loadedAt: string
  routeDays: number[] | null
}

/**
 * Como esta un camion de cara a la carga del deposito. Son las dos unicas cosas que
 * deciden si se lo puede cargar.
 */
export interface VehicleLoadStatus {
  id: string
  name: string
  licensePlate: string
  /** Tiene una salida abierta: no esta en el deposito. */
  isOnRoute: boolean
  /** Unidades ya cargadas y sin salir. */
  pendingUnits: number
}

export const vehicleService = {
  listAll: async (): Promise<Vehicle[]> => {
    const rows: Vehicle[] = []
    let page = 1
    while (true) {
      const result = await api.get<PagedResult<Vehicle>>(`/api/vehicles?pageSize=100&page=${page}`)
      rows.push(...result.items)
      if (!result.hasNextPage) return rows
      page++
    }
  },
  list: (pageSize = 100) => api.get<PagedResult<Vehicle>>(`/api/vehicles?pageSize=${pageSize}`),

  /** La flota con su estado de carga, para saber a cual se puede cargar. */
  getLoadStatus: () => api.get<VehicleLoadStatus[]>('/api/vehicles/load-status'),

  getById: (id: string) => api.get<Vehicle>(`/api/vehicles/${id}`),

  /** Lo que el camion tiene cargado esperando salir. Tambien lo lee el chofer. */
  getPendingLoad: (vehicleId: string) =>
    api.get<VehicleLoadLine[]>(`/api/vehicles/${vehicleId}/load`),

  /** Sube una tanda al camion. Falla con 409 si el camion ya esta en la calle. */
  registerLoad: (vehicleId: string, items: { productId: string; quantity: number }[], routeDays: number[]) =>
    api.post<void>(`/api/vehicles/${vehicleId}/load`, { vehicleId, items, routeDays }),

  updateRouteDays: (vehicleId: string, routeDays: number[]) =>
    api.put<void>(`/api/vehicles/${vehicleId}/load/route-days`, { vehicleId, routeDays }),

  removeLoad: (vehicleId: string, loadId: string) =>
    api.del<void>(`/api/vehicles/${vehicleId}/load/${loadId}`),
}
