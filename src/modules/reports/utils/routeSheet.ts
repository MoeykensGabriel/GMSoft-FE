import { sortProducts } from '../../core'
import type { RouteSheet, RouteSheetCustomer } from '../services/routeSheetService'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

/** Una columna por envase que tenga algún cliente de la hoja, con los dispenser al final. */
export function containerColumns(sheet: RouteSheet) {
  const columnas = new Map<string, string>()
  for (const zona of sheet.zones)
    for (const cliente of zona.customers)
      for (const envase of cliente.containers) columnas.set(envase.productId, envase.productDetail)
  return sortProducts([...columnas].map(([productId, productDetail]) => ({ productId, productDetail })), (p) => p.productDetail)
}

/** Cuántos envases de ese producto tiene el cliente; cero si no tiene. */
export function containerQuantity(customer: RouteSheetCustomer, productId: string) {
  return customer.containers.find((envase) => envase.productId === productId)?.quantity ?? 0
}

/** «Jueves 22/10/2026», de una fecha de calendario `YYYY-MM-DD` sin pasar por UTC. */
export function sheetDateLabel(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  const dia = DIAS[new Date(year, month - 1, day).getDay()]
  return `${dia} ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

/** El nombre que propone el navegador al guardar el PDF. */
export function sheetFileTitle(sheet: RouteSheet) {
  return `Hoja de ruta ${sheet.licensePlate} ${sheet.date}`
}
