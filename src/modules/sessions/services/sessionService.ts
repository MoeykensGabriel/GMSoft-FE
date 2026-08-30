import { api } from '../../core'

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

export interface OpenSessionRequest {
  zoneId: string
  kilometersAtOpen: number
  load: { productId: string; quantity: number }[]
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

export const sessionService = {
  /**
   * La sesion abierta del chofer, o null si no tiene ninguna. El backend devuelve
   * 204 sin cuerpo cuando no hay, y el cliente lo traduce a undefined.
   */
  getCurrent: async () => (await api.get<Session | null>('/api/sessions/current')) ?? null,

  open: (body: OpenSessionRequest) => api.post<string>('/api/sessions/open', body),

  close: (sessionId: string, body: CloseSessionRequest) =>
    api.post<CloseSessionResult>(`/api/sessions/${sessionId}/close`, body),
}
