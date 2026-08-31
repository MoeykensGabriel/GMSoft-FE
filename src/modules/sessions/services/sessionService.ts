import { api } from '../../core'
import type { PagedResult } from '../../core'

export type SessionStatus = 'Open' | 'Closed'
export type ContainerState = 'Full' | 'Empty'

/** Lo que hay a bordo de un producto. Llenos y vacios se cuentan aparte. */
export interface SessionStockLine {
  productId: string
  productDetail: string
  fullOnBoard: number
  emptyOnBoard: number
}

export interface Session {
  id: string
  driverId: string
  driverName: string
  vehicleId: string
  vehicleName: string
  vehicleLicensePlate: string
  zoneId: string
  zoneName: string
  openedAt: string
  closedAt: string | null
  kilometersAtOpen: number
  kilometersAtClose: number | null
  status: SessionStatus
  stock: SessionStockLine[]
}

/** Sin carga: la subio la oficina al camion y la salida se lleva lo que haya arriba. */
export interface OpenSessionRequest {
  zoneId: string
  kilometersAtOpen: number
}

export interface CloseSessionRequest {
  kilometersAtClose: number
  returns: { productId: string; state: ContainerState; quantity: number }[]
}

export interface CloseSessionResult {
  sessionId: string
  cuadraTodo: boolean
  /** Lo que quedo colgado. Vacio si cuadro todo. */
  faltante: SessionStockLine[]
}

export interface SessionDeliveryItem {
  productId: string
  productDetail: string
  quantity: number
  unitPrice: number
}

/** Positivo es lo que quedo en el cliente, negativo lo que devolvio. */
export interface SessionDeliveryContainer {
  productId: string
  productDetail: string
  quantity: number
}

export interface SessionDelivery {
  deliveryId: string
  customerId: string
  customerName: string
  customerAddress: string
  type: 'Sale' | 'ContainerOnly'
  deliveredAt: string
  total: number
  notes: string | null
  items: SessionDeliveryItem[]
  containers: SessionDeliveryContainer[]
}

export interface SessionSettlement {
  sessionId: string
  totalSold: number
  totalCollected: number
  /** Nulo mientras no se rindio. */
  amountReceived: number | null
  /** Vendido menos cobrado: deuda nueva, es normal. */
  newDebt: number
  /** Cobrado menos entregado: plata que no llego. Nulo si no se rindio. */
  cashDifference: number | null
  receivedAt: string | null
  notes: string | null
}

export const sessionService = {
  /**
   * La sesion abierta del chofer, o null si no tiene ninguna. El backend devuelve
   * 204 sin cuerpo cuando no hay, y el cliente lo traduce a undefined.
   */
  getCurrent: async () => (await api.get<Session | null>('/api/sessions/current')) ?? null,

  open: (body: OpenSessionRequest) => api.post<string>('/api/sessions/open', body),

  close: (sessionId: string, body: CloseSessionRequest) =>
    api.post<CloseSessionResult>(`/api/sessions/${sessionId}/close`, body),

  list: (page = 1, pageSize = 20) =>
    api.get<PagedResult<Session>>(`/api/sessions?page=${page}&pageSize=${pageSize}`),

  /**
   * Las salidas de un vehiculo en un dia. La fecha va como YYYY-MM-DD y el backend
   * la entiende como dia local del negocio, no como dia UTC.
   *
   * Devuelve una lista y no una sola salida: nada impide que el mismo camion salga
   * dos veces en el dia, con dos choferes o en dos turnos.
   */
  listByVehicleAndDate: (vehicleId: string, date: string) =>
    api.get<PagedResult<Session>>(
      `/api/sessions?vehicleId=${vehicleId}&date=${date}&pageSize=50`,
    ),

  getById: (sessionId: string) => api.get<Session>(`/api/sessions/${sessionId}`),

  getDeliveries: (sessionId: string) =>
    api.get<SessionDelivery[]>(`/api/sessions/${sessionId}/deliveries`),

  getSettlement: (sessionId: string) =>
    api.get<SessionSettlement>(`/api/sessions/${sessionId}/settlement`),

  registerSettlement: (sessionId: string, amountReceived: number, notes: string | null) =>
    api.post<SessionSettlement>(`/api/sessions/${sessionId}/settlement`, { amountReceived, notes }),
}
