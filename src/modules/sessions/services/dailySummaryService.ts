import { api } from '../../core'
import type { SessionStatus } from './sessionService'

export interface SummaryStock {
  fullLoaded: number
  fullSold: number
  fullReturned: number
  fullDifference: number
  emptyCollected: number
  emptyReturned: number
  emptyDifference: number
}

export interface SummaryProduct {
  productId: string
  productDetail: string
  stock: SummaryStock
}

export interface SummaryMoney {
  cashExpected: number
  transfer: number
  card: number
  cashDeclared: number | null
  cashDifference: number | null
}

export interface SessionDailySummary {
  sessionId: string
  vehicleId: string
  vehicleName: string
  vehicleLicensePlate: string
  driverName: string
  zoneName: string
  openedAt: string
  closedAt: string | null
  status: SessionStatus
  isClosed: boolean
  kilometersAtOpen: number
  kilometersAtClose: number | null
  receivedAt: string | null
  notes: string | null
  money: SummaryMoney
  products: SummaryProduct[]
  totals: SummaryStock
}

export interface DailySummary {
  vehicleId: string
  date: string
  sessions: SessionDailySummary[]
  dayTotals: {
    isClosed: boolean
    pendingSettlements: number
    money: SummaryMoney
    products: SummaryProduct[]
    totals: SummaryStock
  }
}

export const dailySummaryService = {
  get: (vehicleId: string, date: string) => api.get<DailySummary>(
    `/api/sessions/daily-summary?${new URLSearchParams({ vehicleId, date })}`,
  ),
}
