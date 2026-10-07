import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueries } from '@tanstack/react-query'
import { productService } from '../../products'
import { customerService, CustomerAccountSummary } from '../../customers'
import { ApiError, Button, Field, formatMoney, currentBusinessWeekday, newRequestId, PageHeader } from '../../core'
import { useCurrentSession } from '../../sessions'
import { CustomerPicker } from '../components/CustomerPicker'
import { DeliveryLinesEditor } from '../components/DeliveryLinesEditor'
import type { DeliveryLine } from '../components/DeliveryLinesEditor'
import { NewCustomerFields } from '../components/NewCustomerFields'
import { SaleConfirmModal } from '../components/SaleConfirmModal'
import type { Cobro } from '../components/SaleConfirmModal'
import { useRegisterDelivery } from '../hooks/useRegisterDelivery'
import type { NewCustomerLine, PaymentMethod, RegisterDeliveryResult } from '../services/deliveryService'

const CLIENTE_VACIO: NewCustomerLine = {
  businessName: null,
  contactName: '',
  phone: '',
  address: '',
  notes: null,
  visitDays: [],
}

export function RegisterDeliveryView() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data: sesion, isLoading } = useCurrentSession()
  const registrar = useRegisterDelivery()
  const products = useQueries({ queries: (sesion?.stock ?? []).map((product) => ({
    queryKey: ['products', 'sale', product.productId],
    queryFn: () => productService.getById(product.productId),
    staleTime: 0,
  })) })
  const prices = Object.fromEntries(products.filter((query) => query.data).map((query) => [query.data!.id, query.data!.salePrice]))

  const [customerId, setCustomerId] = useState<string | null>(params.get('customerId'))
  const [esNuevo, setEsNuevo] = useState(params.get('new') === '1')
  const specialPrices = useQuery({
    queryKey: ['customers', 'prices', customerId],
    queryFn: () => customerService.getPrices(customerId!),
    enabled: !esNuevo && Boolean(customerId),
    staleTime: 0,
  })
  for (const price of (!esNuevo && customerId ? specialPrices.data ?? [] : [])) prices[price.productId] = price.price
  const pricesReady = products.every((query) => query.isSuccess && Number.isFinite(query.data.salePrice))
    && (esNuevo || Boolean(customerId && specialPrices.isSuccess))
  const directo = Boolean(params.get('customerId'))
  const cliente = useQuery({
    queryKey: ['customers', 'detail', customerId],
    queryFn: () => customerService.getById(customerId!),
    enabled: directo && Boolean(customerId),
  })
  const cuenta = useQuery({
    queryKey: ['customers', 'account', customerId],
    queryFn: () => customerService.getAccount(customerId!),
    enabled: directo && Boolean(customerId),
  })
  const [nuevo, setNuevo] = useState<NewCustomerLine>(() => ({ ...CLIENTE_VACIO, visitDays: [currentBusinessWeekday()] }))
  const [lineas, setLineas] = useState<DeliveryLine[]>([])
  // Null hasta que el chofer responde en el resumen si cobro o queda a deuda.
  const [cobro, setCobro] = useState<Cobro | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  // Identifica esta visita: si el envio se repite, el backend devuelve la ya
  // registrada en vez de duplicar venta, envases y cobro.
  const [requestId] = useState(newRequestId)
  const [metodo, setMetodo] = useState<PaymentMethod>('Cash')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [hecho, setHecho] = useState<RegisterDeliveryResult | null>(null)

  if (isLoading) return <p className="p-6 text-muted">Cargando...</p>

  // Sin salida abierta no hay visita posible: el backend la rechazaria igual.
  if (!sesion) {
    return (
      <div className="mx-auto max-w-md p-6">
        <p className="text-muted">No tenés una salida abierta.</p>
        <Link to="/reparto" className="mt-2 inline-block text-sm text-ink underline">
          Volver
        </Link>
      </div>
    )
  }

  if (hecho) {
    return (
      <div className="ui-card mx-auto flex max-w-md flex-col gap-4 p-6">
        <PageHeader title={<>Visita registrada</>} />
        <div className="ui-card bg-surface p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Total de la visita</span>
            <span className="font-medium text-ink">{formatMoney(hecho.total)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-muted">Le queda debiendo</span>
            <span className="font-medium text-ink">
              {formatMoney(hecho.saldoCuentaCliente)}
            </span>
          </div>
        </div>
        <Button variant="secondary" onClick={() => navigate('/reparto')}>Volver a la salida</Button>
      </div>
    )
  }

  const vendeAlgo = lineas.some((l) => l.vende > 0)
  // En el orden del camion y en centavos, igual que el editor: es lo que se muestra
  // para confirmar. El importe definitivo lo calcula el servidor.
  const vendidas = sesion.stock.flatMap((producto) => {
    const linea = lineas.find((l) => l.productId === producto.productId)
    if (!linea || linea.vende === 0) return []
    const centavos = Math.round((prices[producto.productId] ?? 0) * 100) * linea.vende
    return [{ productId: producto.productId, productDetail: producto.productDetail, quantity: linea.vende, centavos }]
  })
  const totalVenta = vendidas.reduce((sum, linea) => sum + linea.centavos, 0) / 100

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (registrar.isPending || (vendeAlgo && !pricesReady)) return

    if (esNuevo && !nuevo.visitDays.length) {
      setError('Seleccioná al menos un día de visita.')
      return
    }
    // Una venta pasa primero por el resumen, que pregunta si se cobro. Una visita
    // de solo envases no tiene nada que cobrar y se registra directo.
    if (vendeAlgo) {
      setCobro(null)
      setConfirmando(true)
      return
    }
    void registrarVisita()
  }

  async function registrarVisita() {
    if (registrar.isPending) return
    setError(null)
    try {
      const resultado = await registrar.mutateAsync({
        customerId: esNuevo ? null : customerId,
        newCustomer: esNuevo ? nuevo : null,
        // Sin venta es una visita de solo envases. Lo decide lo que se cargo, no
        // una casilla aparte que el chofer se pueda olvidar de tildar.
        type: vendeAlgo ? 'Sale' : 'ContainerOnly',
        items: lineas.filter((l) => l.vende > 0).map((l) => ({ productId: l.productId, quantity: l.vende })),
        containersOut: [],
        containersIn: lineas
          .filter((l) => l.retiraEnvases > 0)
          .map((l) => ({ productId: l.productId, quantity: l.retiraEnvases })),
        // Sin importe: "cobre" significa el total de esta venta, y lo pone el servidor.
        payment: vendeAlgo && cobro === 'cobrada' ? { method: metodo } : null,
        notes: notas.trim() === '' ? null : notas.trim(),
        clientRequestId: requestId,
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
    <form onSubmit={onSubmit} className="ui-card mx-auto flex max-w-md flex-col gap-5 p-6">
      <div>
        <PageHeader title={<>Registrar visita</>} />
        <p className="mt-1 text-sm text-muted">{sesion.zoneName}</p>
        {directo && customerId && <Link to={`/reparto/clientes/${encodeURIComponent(customerId)}`} className="inline-block py-2 text-sm underline">← Volver a la ficha</Link>}
      </div>

      {directo ? <div className="flex flex-col gap-3 ui-card p-3">
        <h2 className="font-semibold">{cliente.data?.displayName ?? 'Cargando cliente…'}</h2>
        <p className="text-sm">{cliente.data?.address}</p>
        {cuenta.data && <CustomerAccountSummary account={cuenta.data} />}
        {(cliente.isError || cuenta.isError) && <p role="alert">No se pudo cargar el cliente. Volvé al recorrido e intentá nuevamente.</p>}
        {cliente.data && (cliente.data.zoneId !== sesion.zoneId || !cliente.data.isActive) && <p role="alert">Este cliente no pertenece al recorrido activo.</p>}
      </div> : params.get('new') === '1' ? <h2 className="font-semibold">Cliente nuevo</h2> : <CustomerPicker
        zoneId={sesion.zoneId}
        routeDays={sesion.routeDays}
        vehicleId={sesion.vehicleId}
        customerId={customerId}
        esNuevo={esNuevo}
        onChange={({ customerId: id, esNuevo: nuevoElegido }) => {
          setCustomerId(id)
          setEsNuevo(nuevoElegido)
        }}
      />}

      {esNuevo && <NewCustomerFields valor={nuevo} onChange={setNuevo} />}

      {(products.some((query) => query.isError) || (!esNuevo && customerId && specialPrices.isError)) && <div role="alert">
        <p>No se pudieron cargar los precios.</p>
        <Button type="button" variant="secondary" onClick={() => {
          products.forEach((query) => { void query.refetch() })
          if (!esNuevo && customerId) void specialPrices.refetch()
        }}>Reintentar</Button>
      </div>}
      <DeliveryLinesEditor stock={sesion.stock} prices={pricesReady ? prices : {}} lineas={lineas} onChange={setLineas} />

      <Field
        label="Observaciones (opcional)"
        name="notas"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
      />

      {esNuevo && !vendeAlgo && (
        <p className="text-sm text-warning">
          A un cliente nuevo hay que venderle algo para darlo de alta.
        </p>
      )}

      {error && !confirmando && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={registrar.isPending || (vendeAlgo && !pricesReady) || (!esNuevo && !customerId) || (directo && (!cliente.data || !cuenta.data || cliente.isError || cuenta.isError || cliente.data.zoneId !== sesion.zoneId || !cliente.data.isActive))}>
          {registrar.isPending ? 'Registrando...' : vendeAlgo ? 'Confirmar venta' : 'Registrar visita'}
        </Button>
        <Button type="button" variant="danger" onClick={() => navigate(directo && customerId ? `/reparto/clientes/${encodeURIComponent(customerId)}` : '/reparto')}>
          Cancelar
        </Button>
      </div>

      {confirmando && (
        <SaleConfirmModal
          lines={vendidas.map((linea) => ({ ...linea, subtotal: linea.centavos / 100 }))}
          total={totalVenta}
          cobro={cobro}
          metodo={metodo}
          onCobro={setCobro}
          onMetodo={setMetodo}
          sending={registrar.isPending}
          error={error}
          onBack={() => { setConfirmando(false); setError(null) }}
          onConfirm={() => { if (cobro !== null) void registrarVisita() }}
        />
      )}
    </form>
  )
}
