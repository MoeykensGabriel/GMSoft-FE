/**
 * API publica del modulo core. Lo que no se exporte aca es privado, aunque el
 * archivo exista: dependency-cruiser bloquea importar por dentro de un modulo.
 *
 * core es puramente tecnico. Si algo de aca empieza a saber de envases, choferes o
 * saldos, no pertenece a core y hay que moverlo a su modulo de negocio.
 */
export { api, ApiError, tokenStorage, setOnUnauthorized } from './lib/api'
export { queryClient } from './lib/queryClient'
export { formatMoney, formatDate, formatDateTime } from './utils/format'
export { Button } from './components/Button'
export { Field } from './components/Field'
export { ErrorMessage } from './components/ErrorMessage'
export { Select } from './components/Select'
export { QuantityInput } from './components/QuantityInput'
export { WeekdaysField } from './components/WeekdaysField'
export { WEEKDAYS, weekdayLabels } from './utils/weekdays'
export type { PagedResult } from './types/paged'
