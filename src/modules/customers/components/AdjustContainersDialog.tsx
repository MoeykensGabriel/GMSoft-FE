import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, ErrorMessage, Modal, QuantityInput, Textarea, sortProducts } from '../../core'
import { productService } from '../../products'
import type { CustomerAccount } from '../services/customerService'
import { customerService } from '../services/customerService'
import { changedCounts } from '../utils/containerAdjust'

/**
 * Admin cuenta lo que el cliente tiene de verdad (por ejemplo, envases del sistema
 * anterior que nunca se cargaron) y corrige el saldo. Se manda la cantidad real.
 */
export function AdjustContainersDialog({ account, onClose }: { account: CustomerAccount; onClose: () => void }) {
  const queryClient = useQueryClient()
  const products = useQuery({ queryKey: ['products', 'all'], queryFn: () => productService.list() })
  const current = Object.fromEntries(account.containers.map((line) => [line.productId, line.quantity]))
  const [counted, setCounted] = useState<Record<string, number>>(current)
  const [reason, setReason] = useState('Envases del sistema anterior')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const byBalance = sortProducts((products.data?.items ?? []).filter((p) => p.tracking === 'ByBalance'), (p) => p.detail)
  const changes = changedCounts(current, counted)

  async function save() {
    setSaving(true); setError(null)
    try {
      // Uno por producto: si uno falla, los anteriores ya quedaron y se ven al recargar la cuenta.
      for (const change of changes)
        await customerService.adjustContainers(account.customerId, change.productId, change.realQuantity, reason.trim())
      await queryClient.invalidateQueries({ queryKey: ['customers'] })
      onClose()
    } catch (e) {
      setError(e)
      await queryClient.invalidateQueries({ queryKey: ['customers'] })
    } finally {
      setSaving(false)
    }
  }

  return <Modal title="Envases en poder del cliente" onClose={onClose} busy={saving} footer={<>
    <Button variant="danger" onClick={onClose} disabled={saving}>Cancelar</Button>
    <Button variant="primary" onClick={() => void save()} disabled={saving || changes.length === 0 || !reason.trim()}>
      {saving ? 'Guardando…' : 'Guardar'}
    </Button>
  </>}>
    {products.isPending && <p role="status">Cargando productos…</p>}
    {products.isError && <ErrorMessage error={products.error} />}
    {byBalance.map((product) => <QuantityInput key={product.id} label={product.detail} max={1000}
      value={counted[product.id] ?? 0} onChange={(value) => setCounted((prev) => ({ ...prev, [product.id]: value }))} />)}
    <Textarea label="Motivo" rows={2} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
    {error !== null && <ErrorMessage error={error} />}
  </Modal>
}
