import { useState } from 'react'
import { Button, WhatsAppButton } from '../../core'

/** El mensaje para el chofer: usuario y contraseña, nada más. */
const accessMessage = (userName: string, password: string) => `Usuario: ${userName}\nContraseña: ${password}`

/**
 * Los datos de acceso recién puestos, para copiarlos o mandarlos al chofer. Se ven solo
 * en este momento: la contraseña no queda guardada a la vista en ningún lado.
 */
export function AccessCard({ userName, password, phone }: { userName: string; password: string; phone?: string }) {
  const [copiado, setCopiado] = useState(false)
  const mensaje = accessMessage(userName, password)
  async function copiar() {
    try { await navigator.clipboard.writeText(mensaje); setCopiado(true) } catch { setCopiado(false) }
  }
  return <div role="status" className="flex flex-col gap-3 rounded border border-success bg-success-light p-4 text-black">
    <p className="font-semibold">Datos para el chofer</p>
    <p className="whitespace-pre-line font-mono text-lg">{mensaje}</p>
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={() => void copiar()}>{copiado ? 'Copiado' : 'Copiar'}</Button>
      {phone && <WhatsAppButton phone={phone} text={mensaje} label="Mandar por WhatsApp" />}
    </div>
  </div>
}
