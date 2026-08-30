import { useQuery } from '@tanstack/react-query'
import { Select, formatMoney } from '../../core'
import { customerService } from '../../customers'

const NUEVO = '__nuevo__'

interface Props {
  zoneId: string
  customerId: string | null
  esNuevo: boolean
  onChange: (valor: { customerId: string | null; esNuevo: boolean }) => void
}

/**
 * Elige a quien se visita: alguien del recorrido de la zona, o uno nuevo que se da
 * de alta en la puerta. Al elegir uno existente muestra su cuenta, que es lo que el
 * chofer necesita saber antes de vender: cuanto debe y cuantos envases tiene.
 */
export function CustomerPicker({ zoneId, customerId, esNuevo, onChange }: Props) {
  const clientes = useQuery({
    queryKey: ['customers', 'zone', zoneId],
    queryFn: () => customerService.listByZone(zoneId),
  })

  const cuenta = useQuery({
    queryKey: ['customers', 'account', customerId],
    queryFn: () => customerService.getAccount(customerId!),
    enabled: Boolean(customerId),
  })

  const seleccion = esNuevo ? NUEVO : (customerId ?? '')

  return (
    <div className="flex flex-col gap-3">
      <Select
        label="Cliente"
        name="cliente"
        value={seleccion}
        onChange={(e) => {
          const v = e.target.value
          onChange({
            customerId: v === NUEVO || v === '' ? null : v,
            esNuevo: v === NUEVO,
          })
        }}
      >
        <option value="">Elegí un cliente</option>
        <option value={NUEVO}>+ Cliente nuevo</option>
        {clientes.data?.items.map((c) => (
          <option key={c.id} value={c.id}>
            {c.routeOrder}. {c.displayName} — {c.address}
          </option>
        ))}
      </Select>

      {cuenta.data && (
        <div className="rounded-md border border-slate-200 bg-white p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Debe</span>
            <span className="font-medium text-slate-900">{formatMoney(cuenta.data.balance)}</span>
          </div>

          <div className="mt-1 flex justify-between">
            <span className="text-slate-600">Sin comprar hace</span>
            <span className="text-slate-900">
              {cuenta.data.daysWithoutPurchase === null
                ? 'nunca compró'
                : `${cuenta.data.daysWithoutPurchase} días`}
            </span>
          </div>

          {cuenta.data.containers.length > 0 && (
            <div className="mt-2 border-t border-slate-100 pt-2">
              <span className="text-slate-600">Envases en su poder</span>
              <ul className="mt-1">
                {cuenta.data.containers.map((c) => (
                  <li key={c.productId} className="flex justify-between">
                    <span className="text-slate-700">{c.productDetail}</span>
                    <span className="text-slate-900">{c.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
