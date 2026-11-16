import { useQuery } from '@tanstack/react-query'
import { api } from '../../modules/core'

/**
 * Los módulos extra de esta instalación (PLANES.md). Mientras carga, o si falla, vale el
 * plan base: una pantalla del módulo nunca se muestra por error.
 */
export function useModules() {
  const query = useQuery({ queryKey: ['installation', 'modules'], queryFn: () => api.get<string[]>('/api/modules'), staleTime: 5 * 60_000 })
  return { enabled: query.data ?? [], isPending: query.isPending }
}
