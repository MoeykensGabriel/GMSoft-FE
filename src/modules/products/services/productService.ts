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

/** Lo que se manda al alta y a la edicion: el producto sin su id. */
export type ProductInput = Omit<Product, 'id'>

export const productService = {
  /** El chofer solo necesita los publicados: son los que puede cargar y vender. */
  listPublished: (pageSize = 100) =>
    api.get<PagedResult<Product>>(`/api/products?onlyPublished=true&pageSize=${pageSize}`),

  /**
   * El catalogo completo, para el admin. A proposito no filtra por publicado: si
   * trajera solo los publicados, despublicar un producto lo haria desaparecer de la
   * pantalla y no quedaria forma de volver a publicarlo.
   */
  list: (pageSize = 100) => api.get<PagedResult<Product>>(`/api/products?pageSize=${pageSize}`),

  getById: (id: string) => api.get<Product>(`/api/products/${id}`),

  create: (input: ProductInput) => api.post<string>('/api/products', input),

  /** El id va tambien en el cuerpo por claridad; el backend usa el de la ruta. */
  update: (id: string, input: ProductInput) => api.put<void>(`/api/products/${id}`, { id, ...input }),

  /** Solo si el producto no tiene movimientos; si los tiene el backend responde 409. */
  remove: (id: string) => api.del<void>(`/api/products/${id}`),
}
