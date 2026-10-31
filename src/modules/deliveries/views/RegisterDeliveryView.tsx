import { sortProducts } from '../../core'
import { orderedZones, zonesLabel } from '../../zones'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueries } from '@tanstack/react-query'
import { productService } from '../../products'
import { customerService, CustomerAccountSummary } from '../../customers'
import { ApiError, Badge, Button, Field, Select, formatMoney, currentBusinessWeekday, isDefiniteRejection, newRequestId, outbox, PageHeader, useOutbox, BackButton } from '../../core'
import { useAuth } from '../../auth'
import { useCurrentSession } from '../../sessions'
import { CustomerPicker } from '../components/CustomerPicker'
import { DeliveryLinesEditor } from '../components/DeliveryLinesEditor'
import type { DeliveryLine } from '../components/DeliveryLinesEditor'
import { NewCustomerFields } from '../components/NewCustomerFields'
import { SaleConfirmModal } from '../components/SaleConfirmModal'
import type { Cobro } from '../components/SaleConfirmModal'
import { useRegisterDelivery } from '../hooks/useRegisterDelivery'
import type { NewCustomerLine, PaymentMethod, RegisterDeliveryResult } from '../services/deliveryService'
import { visitOutboxItem } from '../utils/visitOutbox'
import { exchangeSummary } from '../utils/exchange'
import { loanLimits, loanSummary } from '../utils/loans'

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
  const { user } = useAuth()
  const userId = user?.userId ?? ''
  const bandeja = useOutbox(userId)
  const registrar = useRegisterDelivery()
  const [customerId, setCustomerId] = useState<string | null>(params.get('customerId'))
  const fueraDeDia = params.get('fueraDeDia') === '1' && Boolean(params.get('customerId'))
  const volver = () => navigate('/reparto', fueraDeDia ? { state: { modo: 'pedidos' } } : undefined)
  const [esNuevo, setEsNuevo] = useState(!fueraDeDia && params.get('new') === '1')
  const specialPrices = useQuery({
    queryKey: ['customers', 'prices', customerId],
    queryFn: () => customerService.getPrices(customerId!),
    enabled: !esNuevo && Boolean(customerId),
    staleTime: 0,
  })
  const directo = Boolean(params.get('customerId'))
  const cliente = useQuery({
    queryKey: ['customers', 'detail', customerId],
    queryFn: () => customerService.getById(customerId!),
    enabled: !esNuevo && Boolean(customerId),
  })
  const cuenta = useQuery({
    queryKey: ['customers', 'account', customerId],
    queryFn: () => customerService.getAccount(customerId!),
    enabled: !esNuevo && Boolean(customerId),
  })
  const balances = !esNuevo ? cuenta.data?.containers ?? [] : []
  const productIds = [...new Set([...(sesion?.stock ?? []).map((p) => p.productId), ...balances.map((b) => b.productId)])]
  const products = useQueries({ queries: productIds.map((id) => ({
    queryKey: ['products', 'sale', id], queryFn: () => productService.getById(id), staleTime: 0,
  })) })
  const catalog = sortProducts(products.flatMap((query) => query.data ? [query.data] : []), (p) => p.detail)
  const prices = Object.fromEntries(catalog.map((p) => [p.id, p.salePrice]))
  for (const price of (!esNuevo && customerId ? specialPrices.data ?? [] : [])) prices[price.productId] = price.price
  const productsReady = products.every((query) => query.isSuccess)
  const pricesReady = productsReady && catalog.every((p) => Number.isFinite(p.salePrice))
    && (esNuevo || Boolean(customerId && specialPrices.isSuccess))
  const [nuevo, setNuevo] = useState<NewCustomerLine>(() => ({ ...CLIENTE_VACIO, visitDays: [currentBusinessWeekday()] }))
  const [lineas, setLineas] = useState<DeliveryLine[]>([])
  // Null hasta que el chofer responde en el resumen si cobro o queda a deuda.
  const [cobro, setCobro] = useState<Cobro | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  // Identifica esta visita: si el envio se repite, el backend devuelve la ya
  // registrada en vez de duplicar venta, envases y cobro.
  const [requestId, setRequestId] = useState(newRequestId)
  // Lo que se mandó con esa clave. Si la respuesta se pierde, el reintento manda lo mismo:
  // el backend devuelve la venta original y un cambio (cobrada → a deuda) no se aplicaría.
  const pendiente = useRef<Parameters<typeof registrar.mutateAsync>[0] | null>(null)
  // La respuesta se perdió: la visita quedó en la bandeja del celular y se envía sola.
  const [incierto, setIncierto] = useState(false)
  // False si el celular no dejó guardarla: queda en memoria y se pierde si se cierra la app.
  const [guardadaEnCelular, setGuardadaEnCelular] = useState(true)
  const [metodo, setMetodo] = useState<PaymentMethod>('Cash')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [hecho, setHecho] = useState<RegisterDeliveryResult | null>(null)
  const [cambiosEnviados, setCambiosEnviados] = useState<string[] | null>(null)
  // Conservamos el resumen al enviar: el refresco de saldos ya incluye esta visita.
  const resumenCambios = cambiosEnviados ?? exchangeSummary(lineas, catalog, balances)
  const mostrarCambios = <ul className="flex flex-col gap-1 text-sm">{resumenCambios.map((text) => <li key={text}>{text}</li>)}</ul>
  const resumenPrestamos = loanSummary(sortProducts(lineas, (p) => p.productDetail))
  const mostrarPrestamos = <ul className="flex flex-col gap-1 text-sm">{resumenPrestamos.map((text) => <li key={text}>{text}</li>)}</ul>

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

  if (incierto) {
    // La bandeja la sigue reenviando en segundo plano: si la confirma o la rechaza, se ve acá.
    const enBandeja = bandeja.find((item) => item.id === requestId)
    return (
      <div className="ui-card mx-auto flex max-w-md flex-col gap-4 p-6">
        {!enBandeja ? <>
          <PageHeader title={<>Visita registrada</>} />
          <p className="text-sm">La visita guardada en el celular ya llegó a la oficina.</p>
          {mostrarPrestamos}
          {mostrarCambios}
        </> : enBandeja.status === 'failed' ? <>
          <PageHeader title={<>No se pudo registrar</>} />
          <p role="alert" className="rounded border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            {enBandeja.error} Avisale a la oficina; la visita queda anotada en tu salida hasta que la revisen.
          </p>
        </> : <>
          <PageHeader title={<>Visita guardada en el celular</>} />
          <p className="rounded border border-warning/40 bg-warning-soft p-3 text-sm text-warning">
            No pudimos confirmar si llegó. Quedó guardada y se envía sola cuando vuelva la señal, sin duplicarse.
            No la cargues de nuevo.
          </p>
          {!guardadaEnCelular && <p role="alert" className="text-sm text-danger">
            El celular no dejó guardarla: se reintenta mientras la app esté abierta. No la cierres hasta que se confirme.
          </p>}
          <Button type="button" disabled={registrar.isPending} onClick={() => void registrarVisita()}>
            {registrar.isPending ? 'Enviando…' : 'Reintentar ahora'}
          </Button>
        </>}
        <Button variant="secondary" onClick={volver}>Volver a la salida</Button>
      </div>
    )
  }

  if (hecho) {
    return (
      <div className="ui-card mx-auto flex max-w-md flex-col gap-4 p-6">
        <PageHeader title={<>Visita registrada</>} />
        {mostrarPrestamos}
        {mostrarCambios}
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
        <Button variant="secondary" onClick={volver}>Volver a la salida</Button>
      </div>
    )
  }

  // Ya hay una visita de este cliente esperando en la bandeja: otra podría duplicarla si la primera llegó.
  const guardada = !esNuevo && customerId
    ? bandeja.find((item) => item.customerId === customerId && item.sessionId === sesion.id)
    : undefined

  const vendeAlgo = lineas.some((l) => l.vende > 0)
  const mueveAlgo = lineas.some((l) => l.vende > 0 || l.retiraEnvases > 0 || l.presta > 0 || l.retiraPrestamo > 0)
  const prestamosValidos = lineas.every((l) => {
    if (!l.presta && !l.retiraPrestamo) return true
    const product = catalog.find((p) => p.id === l.productId)
    const limits = loanLimits(sesion.stock.find((s) => s.productId === l.productId)?.fullOnBoard ?? 0,
      l.vende, balances.find((b) => b.productId === l.productId)?.quantity ?? 0)
    return product?.canBeLent && product.tracking === 'None' && l.presta <= limits.maxOut && l.retiraPrestamo <= limits.maxIn
  })
  const clienteValido = Boolean(cliente.data?.isActive && !cliente.data.removalPending
    && cliente.data.vehicleId === sesion.vehicleId
    && (fueraDeDia || (orderedZones(sesion).some((zone) => zone.zoneId === cliente.data?.zoneId)
    && cliente.data.visitDays?.some((day) => sesion.routeDays.includes(day)))))
  const datosListos = productsReady && (esNuevo || cuenta.isSuccess)
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
    if ((!esNuevo && !clienteValido) || registrar.isPending || !datosListos || !mueveAlgo || !prestamosValidos || (vendeAlgo && !pricesReady) || guardada) return

    if (esNuevo && (!nuevo.visitDays.length || !vendeAlgo)) {
      setError('Seleccioná al menos un día de visita.')
      return
    }
    setCobro(null)
    setConfirmando(true)
  }

  async function registrarVisita() {
    if (registrar.isPending) return
    setError(null)
    const cuerpo = pendiente.current ?? {
        customerId: esNuevo ? null : customerId,
        newCustomer: esNuevo ? { ...nuevo, zoneId: nuevo.zoneId ?? orderedZones(sesion)[0]?.zoneId } : null,
        // Sin venta es una visita de solo envases. Lo decide lo que se cargo, no
        // una casilla aparte que el chofer se pueda olvidar de tildar.
        type: vendeAlgo ? 'Sale' : 'ContainerOnly',
        items: lineas.filter((l) => l.vende > 0).map((l) => ({ productId: l.productId, quantity: l.vende })),
        containersOut: [],
        loansOut: lineas.filter((l) => l.presta > 0).map((l) => ({ productId: l.productId, quantity: l.presta })),
        loansIn: lineas.filter((l) => l.retiraPrestamo > 0).map((l) => ({ productId: l.productId, quantity: l.retiraPrestamo })),
        containersIn: lineas
          .filter((l) => l.retiraEnvases > 0)
          .map((l) => ({ productId: l.productId, quantity: l.retiraEnvases })),
        // Sin importe: "cobre" significa el total de esta venta, y lo pone el servidor.
        payment: vendeAlgo && cobro === 'cobrada' ? { method: metodo } : null,
        notes: notas.trim() === '' ? null : notas.trim(),
        clientRequestId: requestId,
        expectedSessionId: sesion!.id,
        ...(fueraDeDia ? { outOfRoute: true } : {}),
      }
    if (!pendiente.current) {
      // Otra pestaña pudo haber guardado una visita de este cliente recién: se vuelve a mirar.
      if (!esNuevo && customerId && outbox.list(userId).some((item) =>
        item.customerId === customerId && item.sessionId === sesion!.id && item.status === 'pending')) {
        setError('Ya hay una visita de este cliente guardada en el celular, esperando enviarse.')
        setConfirmando(false)
        return
      }
      // A salvo antes de mandar: si se corta la señal o se cierra la app, la bandeja la reenvía.
      // Solo en el primer envío: un reintento ya está guardado y no rearma nada del formulario.
      setCambiosEnviados(resumenCambios)
      const nombre = esNuevo ? nuevo.contactName : cliente.data?.displayName ?? 'Cliente del recorrido'
      const detalle = vendidas.map((l) => `${l.quantity} × ${l.productDetail}`).join(', ')
      const retira = lineas.filter((l) => l.retiraEnvases > 0).reduce((sum, l) => sum + l.retiraEnvases, 0)
      const resumen = [detalle, retira ? `retira ${retira} envases` : '', ...resumenPrestamos].filter(Boolean).join(' · ') || 'visita'
      setGuardadaEnCelular(outbox.put(visitOutboxItem({ userId, sessionId: sesion!.id, body: cuerpo,
        label: `${nombre}: ${resumen}${vendeAlgo ? (cobro === 'cobrada' ? ' · cobrada' : ' · a deuda') : ''}` })))
    }
    pendiente.current = cuerpo
    try {
      const resultado = await registrar.mutateAsync(cuerpo)
      outbox.remove(userId, cuerpo.clientRequestId)
      pendiente.current = null
      setIncierto(false)
      setHecho(resultado)
    } catch (err) {
      // 401, 408 y 429 no dicen nada del envío anterior: se conserva en la bandeja.
      if (err instanceof ApiError && isDefiniteRejection(err.status)) {
        // Rechazo definitivo: no se registró nada. Corregir es un envío nuevo, con otra clave.
        outbox.remove(userId, cuerpo.clientRequestId)
        pendiente.current = null
        setIncierto(false)
        setRequestId(newRequestId())
        setCambiosEnviados(null)
        setError(err.fieldMessages[0] ?? err.detail ?? err.title)
      } else {
        setIncierto(true)
        setError(null)
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="ui-card mx-auto flex max-w-md flex-col gap-5 p-6">
      <div>
        {fueraDeDia && <BackButton onClick={volver} label="Volver a Pedidos" appearance="link" />}
        {directo && customerId && !fueraDeDia && <BackButton to={`/reparto/clientes/${encodeURIComponent(customerId)}`} label="Volver a la ficha" appearance="link" />}
        <PageHeader title={<>Registrar visita</>} />
        {fueraDeDia && <Badge tone="pedido">Fuera del recorrido</Badge>}
        <p className="mt-1 text-sm text-muted">{zonesLabel(sesion)}</p>
      </div>

      {guardada && <p role="alert" className="rounded border border-warning/40 bg-warning-soft p-3 text-sm text-warning">
        Ya hay una visita de este cliente guardada en el celular, esperando enviarse ({guardada.label}).
        Esperá a que se confirme antes de cargar otra.
      </p>}
      <fieldset disabled={registrar.isPending || Boolean(guardada) || confirmando} className="flex min-w-0 flex-col gap-5">
      {directo ? <div className={`flex flex-col gap-3 ui-card p-3${fueraDeDia ? ' border-2 border-warning rounded' : ''}`}>
        <h2 className="font-semibold">{cliente.data?.displayName ?? 'Cargando cliente…'}</h2>
        <p className="text-sm">{cliente.data?.address}</p>
        {cuenta.data && <CustomerAccountSummary account={cuenta.data} />}
        {(cliente.isError || cuenta.isError) && <p role="alert">No se pudo cargar el cliente. Volvé al recorrido e intentá nuevamente.</p>}
        {cliente.data && (!clienteValido) && <p role="alert">Este cliente no pertenece al camión, zonas y días de tu recorrido.</p>}
      </div> : params.get('new') === '1' ? <h2 className="font-semibold">Cliente nuevo</h2> : <CustomerPicker
        zones={orderedZones(sesion)}
        routeDays={sesion.routeDays}
        vehicleId={sesion.vehicleId}
        customerId={customerId}
        esNuevo={esNuevo}
        onChange={({ customerId: id, esNuevo: nuevoElegido }) => {
          setCustomerId(id)
          setEsNuevo(nuevoElegido)
          setLineas([])
        }}
      />}

      {esNuevo && orderedZones(sesion).length > 1 && <Select label="Zona" value={nuevo.zoneId ?? orderedZones(sesion)[0]?.zoneId} onChange={(event) => setNuevo({ ...nuevo, zoneId: event.target.value })}>
        {orderedZones(sesion).map((zone) => <option key={zone.zoneId} value={zone.zoneId}>{zone.zoneName}</option>)}
      </Select>}
      {esNuevo && <NewCustomerFields valor={nuevo} onChange={setNuevo} />}

      {(products.some((query) => query.isError) || (!esNuevo && customerId && specialPrices.isError)) && <div role="alert">
        <p>No se pudieron cargar los precios.</p>
        <Button type="button" variant="secondary" onClick={() => {
          products.forEach((query) => { void query.refetch() })
          if (!esNuevo && customerId) void specialPrices.refetch()
        }}>Reintentar</Button>
      </div>}
      <DeliveryLinesEditor stock={sesion.stock} prices={pricesReady ? prices : {}} lineas={lineas} onChange={setLineas}
        products={catalog} balances={balances} />

      <Field
        label="Observaciones (opcional)"
        name="notas"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
      />
      </fieldset>
      {!prestamosValidos && <p role="alert" className="text-sm text-danger">Cambió el stock o lo que tiene prestado el cliente. Revisá las cantidades de préstamos.</p>}
      {!esNuevo && cuenta.isError && <p role="alert">No se pudo consultar lo que tiene el cliente. Volvé a su ficha e intentá nuevamente.</p>}

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

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={(!esNuevo && !clienteValido) || registrar.isPending || !datosListos || !mueveAlgo || !prestamosValidos || (esNuevo && !vendeAlgo) || Boolean(guardada) || (vendeAlgo && !pricesReady) || (!esNuevo && !customerId) || (directo && (!cliente.data || !cuenta.data || cliente.isError || cuenta.isError || !clienteValido))}>
          {registrar.isPending ? 'Registrando...' : vendeAlgo ? 'Confirmar venta' : 'Registrar visita'}
        </Button>
        <Button type="button" variant="danger" onClick={() => fueraDeDia ? volver() : navigate(directo && customerId ? `/reparto/clientes/${encodeURIComponent(customerId)}` : '/reparto')}>
          Cancelar
        </Button>
      </div>

      {confirmando && (
        <SaleConfirmModal
          lines={vendidas.map((linea) => ({ ...linea, subtotal: linea.centavos / 100 }))}
          total={totalVenta}
          loanSummary={resumenPrestamos}
          containersSummary={[...sortProducts(lineas, (p) => p.productDetail).filter((l) => l.retiraEnvases > 0).map((l) => `Retira ${l.retiraEnvases} envases de ${l.productDetail}`), ...resumenCambios]}
          cobro={cobro}
          metodo={metodo}
          onCobro={setCobro}
          onMetodo={setMetodo}
          sending={registrar.isPending}
          error={error}
          onBack={() => { setConfirmando(false); setError(null) }}
          onConfirm={() => { if ((!vendeAlgo || cobro !== null) && prestamosValidos && datosListos) void registrarVisita() }}
        />
      )}
    </form>
  )
}
