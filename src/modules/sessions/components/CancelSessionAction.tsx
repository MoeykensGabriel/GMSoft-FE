import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button, ErrorMessage, Modal, Textarea } from '../../core'
import { sessionService } from '../services/sessionService'

/**
 * Anular una salida abierta que no tuvo movimientos: por ejemplo, la oficina la abrió y el
 * chofer no vino. Pide motivo y confirmación; si ya tiene visitas, la API lo rechaza y lo dice.
 */
export function CancelSessionAction({ sessionId, driverName }: { sessionId: string; driverName: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const cancel = useMutation({
    mutationFn: () => sessionService.cancel(sessionId, reason.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sessions'] })
      navigate('/panel/salidas', { replace: true, state: { cancelled: driverName } })
    },
  })
  const close = () => { if (!cancel.isPending) { setOpen(false); cancel.reset() } }

  return <>
    <Button variant="secondary" onClick={() => setOpen(true)}>Anular salida</Button>
    {open && <Modal title="Anular salida" busy={cancel.isPending} onClose={close} footer={<>
      <Button variant="secondary" disabled={cancel.isPending} onClick={close}>Volver</Button>
      <Button variant="danger" disabled={cancel.isPending || reason.trim() === ''} onClick={() => cancel.mutate()}>
        {cancel.isPending ? 'Anulando...' : 'Anular salida'}
      </Button>
    </>}>
      <p className="text-sm">
        Se anula la salida de <strong>{driverName}</strong>. Solo se puede si no tiene visitas, cobros, recargas ni promociones.
        La carga vuelve a quedar pendiente en el camión para abrir otra salida.
      </p>
      <Textarea label="Motivo" name="reason" required maxLength={300} rows={2}
        placeholder="Ej.: se abrió y el chofer no vino" value={reason} onChange={(e) => setReason(e.target.value)} />
      <ErrorMessage error={cancel.error} />
    </Modal>}
  </>
}
