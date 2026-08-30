import { api } from '../../core'
import type { PagedResult } from '../../core'

/** Como se sigue el envase de un producto. Espeja el enum del backend. */
export type ContainerTracking = 'None' | 'ByBalance' | 'ByUnit'

export interface Product {
  id: string
  detail: string
  commercialDetail: string | null
  salePrice: number
  tracking: ContainerTracking
  isPublished: boolean
  imageUrl: string | null
}

export const productService = {
  /** El chofer solo necesita los publicados: son los que puede cargar y vender. */
  listPublished: (pageSize = 100) =>
    api.get<PagedResult<Product>>(`/api/products?onlyPublished=true&pageSize=${pageSize}`),
}
