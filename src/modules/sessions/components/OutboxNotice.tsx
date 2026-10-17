import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, flushOutbox, outbox } from '../../core'
import type { OutboxItem } from '../../core'

/**
 * Lo que está guardado en el celular: lo que se sigue enviando solo y lo que la oficina
 * rechazó (hay que avisarle; queda anotado acá hasta quitarlo a mano).
 */
export function OutboxNotice({ userId, items }: { userId: string; items: OutboxItem[] }) {
  const client = useQueryClient()
  const [sending, setSending] = useState(false)
  const [discarding, setDiscarding] = useState<string | null>(null)
  const pending = items.filter((item) => item.status === 'pending')
  const failed = items.filter((item) => item.status === 'failed')
  if (!pending.length && !failed.length) return null
  return <>
    {pending.length > 0 && <section role="status" className="flex flex-col gap-2 rounded border border-warning/40 bg-warning-soft p-3 text-sm text-warning">
      <p className="font-semibold">{pending.length === 1 ? '1 visita guardada en el celular' : `${pending.length} visitas guardadas en el celular`}, enviándose</p>
      <p>Se mandan solas cuando vuelve la señal, sin duplicarse. No las cargues de nuevo.</p>
      <ul className="list-disc pl-5">{pending.map((item) => <li key={item.id}>{item.label}</li>)}</ul>
      <Button variant="secondary" disabled={sending} onClick={async () => {
        setSending(true)
        try { await flushOutbox(userId, client) } finally { setSending(false) }
      }}>{sending ? 'Enviando…' : 'Enviar ahora'}</Button>
    </section>}
    {failed.map((item) => <section key={item.id} role="alert" className="flex flex-col gap-2 rounded border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
      <p className="font-semibold">No se pudo registrar: {item.label}</p>
      <p>{item.error} Avisale a la oficina con estos datos.</p>
      {discarding === item.id
        ? <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setDiscarding(null)}>No, dejarla</Button>
          <Button variant="danger" onClick={() => { outbox.remove(userId, item.id); setDiscarding(null) }}>Sí, quitarla</Button>
        </div>
        : <Button variant="secondary" onClick={() => setDiscarding(item.id)}>Ya le avisé a la oficina, quitarla</Button>}
    </section>)}
  </>
}
