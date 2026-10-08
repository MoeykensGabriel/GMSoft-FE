import { useState } from 'react'
import type { FormEvent } from 'react'
import { useQueries } from '@tanstack/react-query'
import { Button, ErrorMessage, LinkButton, Page, PageHeader, QuantityInput, currentBusinessWeekday } from '../../core'
import { useCurrentSession } from '../../sessions'
import { productService } from '../../products'
import { promotionService } from '../services/promotionService'
import type { Prospect, RegisterPromotion } from '../services/promotionService'
import { usePromotionWrite } from '../hooks/usePromotionWrite'
import { ProspectFields } from '../components/ProspectFields'
import { ProspectSummary } from '../components/PromotionSummary'
import { WriteConfirmation } from '../components/WriteConfirmation'
import { pickupLabel, validProspect } from '../utils/promotion'

export function RegisterPromotionView() {
  const session = useCurrentSession()
  const write = usePromotionWrite<RegisterPromotion>(promotionService.register)
  const products = useQueries({ queries: (session.data?.stock ?? []).map((line) => ({
    queryKey: ['products', 'promotion', line.productId],
    queryFn: () => productService.getById(line.productId), staleTime: 0,
  })) })
  const [prospect, setProspect] = useState<Prospect>(() => ({ businessName: null, contactName: '', phone: '', address: '', notes: null, visitDays: [currentBusinessWeekday()] }))
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [confirmation, setConfirmation] = useState<{
    prospect: Prospect
    lines: { productId: string; productDetail: string; quantity: number; loaned: number }[]
  } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [validation, setValidation] = useState('')
  const available = (session.data?.stock ?? []).flatMap((line, index) => {
    const tracking = products[index]?.data?.tracking
    return tracking === 'None' || tracking === 'ByBalance' ? [{ ...line, tracking }] : []
  })
  const ready = products.every((query) => query.isSuccess) && session.isSuccess && session.data?.status === 'Open'

  function review(event: FormEvent) {
    event.preventDefault()
    if (write.locked) { setShowModal(true); return }
    const lines = available.filter((line) => (quantities[line.productId] ?? 0) > 0).map((line) => ({
      productId: line.productId, productDetail: line.productDetail, quantity: quantities[line.productId],
      loaned: line.tracking === 'ByBalance' ? quantities[line.productId] : 0,
    }))
    if (!ready || !validProspect(prospect) || !lines.length || lines.some((line) => !Number.isInteger(line.quantity)
      || line.quantity > (available.find((product) => product.productId === line.productId)?.fullOnBoard ?? 0))) {
      setValidation('Completá los datos, elegí al menos un día y cantidades dentro del stock disponible.')
      return
    }
    setValidation('')
    setConfirmation(structuredClone({ prospect, lines }))
    setShowModal(true)
  }

  if (write.data) return <Page className="mx-auto flex max-w-md flex-col gap-4 p-4">
    <PageHeader title="Promoción registrada" />
    <p role="status">Fecha de retiro: <strong>{pickupLabel(write.data.pickupDate)}</strong>.</p>
    <LinkButton to="/reparto">Volver al recorrido</LinkButton>
  </Page>

  return <Page className="mx-auto flex max-w-md flex-col gap-4 p-4">
    <PageHeader title="Registrar promoción" description="Dejá productos de prueba sin precio ni cobro. El prospecto todavía no se registra como cliente." />
    <ErrorMessage error={session.error} />
    {session.isPending && <p role="status">Cargando tu salida...</p>}
    {session.isError && <Button variant="secondary" onClick={() => session.refetch()}>Reintentar salida</Button>}
    {session.isSuccess && !session.data && <p>No tenés una salida abierta.</p>}
    {(session.data || write.locked) && <form onSubmit={review} className="flex flex-col gap-4">
      <fieldset disabled={write.locked || write.isPending} className="flex min-w-0 flex-col gap-4">
        <ProspectFields value={prospect} onChange={setProspect} />
        <h2 className="ui-section-heading">Productos de prueba</h2>
        {products.some((query) => query.isPending) && <p role="status">Comprobando productos a bordo...</p>}
        {products.some((query) => query.isError) && <>
          <ErrorMessage error={products.find((query) => query.isError)?.error} />
          <Button type="button" variant="secondary" onClick={() => products.forEach((query) => { void query.refetch() })}>Reintentar productos</Button>
        </>}
        {ready && available.every((line) => line.fullOnBoard <= 0) && <p>No tenés llenos disponibles para promociones.</p>}
        {available.filter((line) => line.fullOnBoard > 0 || quantities[line.productId] > 0).map((line) => <div key={line.productId} className="ui-card flex flex-col gap-2 p-3">
          <p className="text-sm">{line.fullOnBoard} llenos disponibles · {line.tracking === 'ByBalance' ? 'Un envase prestado por unidad' : 'Sin envases prestados'}</p>
          <QuantityInput label={line.productDetail} value={quantities[line.productId] ?? 0} max={line.fullOnBoard}
            onChange={(quantity) => setQuantities({ ...quantities, [line.productId]: quantity })} />
        </div>)}
      </fieldset>
      {validation && <p role="alert" className="text-danger text-sm">{validation}</p>}
      {write.locked && <p className="text-sm">Hay un envío pendiente de confirmar. Conservamos sus datos para reintentarlo.</p>}
      <Button type="submit" disabled={write.isPending || (!write.locked && !ready)}>{write.locked ? 'Revisar envío pendiente' : 'Revisar promoción'}</Button>
    </form>}
    {!write.locked && <LinkButton to="/reparto" variant="danger">Volver al recorrido</LinkButton>}
    {showModal && confirmation && <WriteConfirmation title="Confirmar promoción" busy={write.isPending} locked={write.locked}
      error={write.error} canCorrect={write.canCorrect} onCorrect={() => { write.correct(); setShowModal(false) }}
      onClose={() => setShowModal(false)} onConfirm={() => { void write.send({ prospect: confirmation.prospect,
        items: confirmation.lines.map(({ productId, quantity }) => ({ productId, quantity })) }) }}>
      <ProspectSummary prospect={confirmation.prospect} />
      <ul className="flex flex-col gap-2 text-sm">{confirmation.lines.map((line) => <li key={line.productId}>
        {line.quantity} × {line.productDetail} · Quedan {line.loaned} envases prestados
      </li>)}</ul>
      <p className="text-sm">Sin precio ni cobro. La fecha de retiro se informa al registrar.</p>
    </WriteConfirmation>}
  </Page>
}
