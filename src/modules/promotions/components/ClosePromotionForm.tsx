import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, QuantityInput } from '../../core'
import type { ClosePromotion, Promotion } from '../services/promotionService'
import { promotionService } from '../services/promotionService'
import { usePromotionWrite } from '../hooks/usePromotionWrite'
import { validProspect } from '../utils/promotion'
import { ProspectFields } from './ProspectFields'
import { PromotionSummary, ProspectSummary } from './PromotionSummary'
import { WriteConfirmation } from './WriteConfirmation'

export function ClosePromotionForm({ promotion, convert, onBack }: { promotion: Promotion; convert: boolean; onBack: () => void }) {
  const write = usePromotionWrite<ClosePromotion>((body) => promotionService.close(promotion.id, body))
  const [edit, setEdit] = useState(false)
  const [customer, setCustomer] = useState(() => structuredClone(promotion.prospect))
  const loans = promotion.lines.filter((line) => line.containersLoaned > 0)
  const [returned, setReturned] = useState<Record<string, number>>(() => Object.fromEntries(loans.map((line) => [line.productId, line.containersLoaned])))
  const [confirmation, setConfirmation] = useState<Omit<ClosePromotion, 'clientRequestId'> | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [validation, setValidation] = useState('')
  const title = convert ? 'Se hace cliente' : 'No se hace cliente'

  function review(event: FormEvent) {
    event.preventDefault()
    if (write.locked) { setShowModal(true); return }
    if ((convert && edit && !validProspect(customer)) || (!convert && loans.some((line) =>
      !Number.isInteger(returned[line.productId]) || returned[line.productId] < 0 || returned[line.productId] > line.containersLoaned))) {
      setValidation('Revisá los datos y las cantidades antes de confirmar.')
      return
    }
    setValidation('')
    setConfirmation(structuredClone({ convertToCustomer: convert, customer: convert && edit ? customer : null,
      containersReturned: convert ? [] : loans.map((line) => ({ productId: line.productId, quantity: returned[line.productId] })),
    }))
    setShowModal(true)
  }
  if (write.data) return <div className="ui-card flex flex-col gap-3 p-4">
    <p role="status" className="font-semibold">{write.data.status === 'Converted' ? 'Promoción convertida en cliente. Los envases pasaron a su saldo.' : 'Promoción cerrada. Los retiros y las pérdidas quedaron registrados.'}</p>
    <Button variant="navigation" onClick={onBack}>Volver a las pendientes</Button>
  </div>

  return <form onSubmit={review} className="ui-card flex flex-col gap-4 p-4">
    <h3 className="font-semibold">{title}</h3>
    <PromotionSummary promotion={promotion} />
    <fieldset disabled={write.locked || write.isPending} className="flex min-w-0 flex-col gap-4">
      {convert ? <>
        <p>Los envases quedan en su poder y pasan a su saldo de cliente. No se registra deuda ni compra.</p>
        <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={edit} onChange={(event) => setEdit(event.target.checked)} />Corregir datos antes de crear el cliente</label>
        {edit && <ProspectFields value={customer} onChange={setCustomer} />}
      </> : <>
        <p>Indicá cuántos envases retirás. Los que no recuperes quedarán registrados como perdidos.</p>
        {!loans.length && <p>Esta promoción no tiene envases prestados.</p>}
        {loans.map((line) => <div key={line.productId} className="flex flex-col gap-2">
          <QuantityInput label={`Retirar: ${line.productDetail}`} value={returned[line.productId]} max={line.containersLoaned}
            onChange={(quantity) => setReturned({ ...returned, [line.productId]: quantity })} />
          <p className="text-sm" role="status">Prestados: {line.containersLoaned} · Quedarán perdidos: {line.containersLoaned - returned[line.productId]}</p>
        </div>)}
      </>}
    </fieldset>
    {validation && <p role="alert" className="text-sm text-danger">{validation}</p>}
    <Button type="submit" disabled={write.isPending}>{write.locked ? 'Revisar cierre pendiente' : 'Revisar cierre'}</Button>
    <Button type="button" variant="danger" disabled={write.locked} onClick={onBack}>Cancelar</Button>
    {write.locked && <p className="text-sm">Reintentá este cierre antes de elegir otro resultado.</p>}
    {showModal && confirmation && <WriteConfirmation title={`Confirmar: ${title.toLowerCase()}`} busy={write.isPending} locked={write.locked}
      error={write.error} canCorrect={write.canCorrect} onCorrect={() => { write.correct(); setShowModal(false) }}
      onClose={() => setShowModal(false)} onConfirm={() => { void write.send(confirmation) }}>
      <ProspectSummary prospect={confirmation.customer ?? promotion.prospect} />
      {convert ? <>
        <p>Se crea el cliente con {confirmation.customer ? 'los datos corregidos' : 'los datos guardados'}. Los envases quedan en su poder y pasan a su saldo.</p>
        <ul>{loans.map((line) => <li key={line.productId}>{line.productDetail}: {line.containersLoaned} envases</li>)}</ul>
      </> : <ul className="flex flex-col gap-2 text-sm">{loans.map((line) => {
        const quantity = confirmation.containersReturned.find((item) => item.productId === line.productId)?.quantity ?? 0
        return <li key={line.productId}>{line.productDetail}: {quantity} retirados · {line.containersLoaned - quantity} perdidos</li>
      })}{!loans.length && <li>Sin envases para retirar ni registrar como perdidos.</li>}</ul>}
    </WriteConfirmation>}
  </form>
}
