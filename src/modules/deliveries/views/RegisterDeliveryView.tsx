import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, Button, Field, formatMoney } from '../../core'
import { useCurrentSession } from '../../sessions'
import { CustomerPicker } from '../components/CustomerPicker'
import { DeliveryLinesEditor } from '../components/DeliveryLinesEditor'
import type { DeliveryLine } from '../components/DeliveryLinesEditor'
import { NewCustomerFields } from '../components/NewCustomerFields'
import { PaymentFields } from '../components/PaymentFields'
import { useRegisterDelivery } from '../hooks/useRegisterDelivery'
import type { NewCustomerLine, PaymentMethod, RegisterDeliveryResult } from '../services/deliveryService'

const CLIENTE_VACIO: NewCustomerLine = {
  businessName: null,
  contactName: '',
  phone: '',
  address: '',
  notes: null,
}

export function RegisterDeliveryView() {
  const navigate = useNavigate()
  const { data: sesion, isLoading } = useCurrentSession()
  const registrar = useRegisterDelivery()

  const [customerId, setCustomerId] = useState<string | null>(null)
  const [esNuevo, setEsNuevo] = useState(false)
  const [nuevo, setNuevo] = useState<NewCustomerLine>(CLIENTE_VACIO)
  const [lineas, setLineas] = useState<DeliveryLine[]>([])
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState<PaymentMethod>('Cash')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [hecho, setHecho] = useState<RegisterDeliveryResult | null>(null)

  if (isLoading) return <p className="p-6 text-slate-500">Cargando...</p>

  // Sin salida abierta no hay visita posible: el backend la rechazaria igual.
  if (!sesion) {
    return (
      <div className="mx-auto max-w-md p-6">
        <p className="text-slate-700">No tenés una salida abierta.</p>
        <Link to="/reparto" className="mt-2 inline-block text-sm text-slate-900 underline">
          Volver
        </Link>
      </div>
    )
  }

  if (hecho) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold text-slate-900">Visita registrada</h1>
        <div className="rounded-md border border-slate-200 bg-white p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Total de la visita</span>
            <span className="font-medium text-slate-900">{formatMoney(hecho.total)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-slate-600">Le queda debiendo</span>
            <span className="font-medium text-slate-900">
              {formatMoney(hecho.saldoCuentaCliente)}
            </span>
          </div>
        </div>
        <Button onClick={() => navigate('/reparto')}>Volver a la salida</Button>
      </div>
    )
  }

  const vendeAlgo = lineas.some((l) => l.vende > 0)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      const resultado = await registrar.mutateAsync({
        customerId: esNuevo ? null : customerId,
        newCustomer: esNuevo ? nuevo : null,
        // Sin venta es una visita de solo envases. Lo decide lo que se cargo, no
        // una casilla aparte que el chofer se pueda olvidar de tildar.
        type: vendeAlgo ? 'Sale' : 'ContainerOnly',
        items: lineas.filter((l) => l.vende > 0).map((l) => ({ productId: l.productId, quantity: l.vende })),
        containersOut: lineas
          .filter((l) => l.dejaEnvases > 0)
          .map((l) => ({ productId: l.productId, quantity: l.dejaEnvases })),
        containersIn: lineas
          .filter((l) => l.retiraEnvases > 0)
          .map((l) => ({ productId: l.productId, quantity: l.retiraEnvases })),
        payment: Number(monto) > 0 ? { amount: Number(monto), method: metodo } : null,
        notes: notas.trim() === '' ? null : notas.trim(),
      })

      setHecho(resultado)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.fieldMessages[0] ?? err.detail ?? err.title)
      } else {
        setError('No se pudo conectar con el servidor.')
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-md flex-col gap-5 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Registrar visita</h1>
        <p className="mt-1 text-sm text-slate-600">{sesion.zoneName}</p>
      </div>

      <CustomerPicker
        zoneId={sesion.zoneId}
        customerId={customerId}
        esNuevo={esNuevo}
        onChange={({ customerId: id, esNuevo: nuevoElegido }) => {
          setCustomerId(id)
          setEsNuevo(nuevoElegido)
        }}
      />

      {esNuevo && <NewCustomerFields valor={nuevo} onChange={setNuevo} />}

      <DeliveryLinesEditor stock={sesion.stock} lineas={lineas} onChange={setLineas} />

      <PaymentFields monto={monto} metodo={metodo} onMonto={setMonto} onMetodo={setMetodo} />

      <Field
        label="Observaciones (opcional)"
        name="notas"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
      />

      {esNuevo && !vendeAlgo && (
        <p className="text-sm text-amber-700">
          A un cliente nuevo hay que venderle algo para darlo de alta.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={registrar.isPending}>
          {registrar.isPending ? 'Registrando...' : 'Registrar visita'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/reparto')}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
