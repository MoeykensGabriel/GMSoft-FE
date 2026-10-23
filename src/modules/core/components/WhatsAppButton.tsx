import { actionStyles } from './actionStyles'

/**
 * El número como lo espera WhatsApp: solo dígitos y con código de país. Los celulares
 * se cargan sin prefijo ("3815550142"), así que se asume Argentina (54 9).
 */
function whatsAppNumber(phone: string): string | null {
  let digits = phone.replace(/\D/g, '').replace(/^0+/, '')
  if (digits.length < 8) return null
  if (!digits.startsWith('54')) digits = `549${digits}`
  return digits
}

/** Abre el chat de WhatsApp del número, con `text` ya escrito si viene; sin número válido muestra el texto tal cual. */
export function WhatsAppButton({ phone, name, text, label = 'WhatsApp', className = '' }: { phone: string; name?: string; text?: string; label?: string; className?: string }) {
  const number = whatsAppNumber(phone)
  if (!number) return <span>{phone || 'Sin teléfono'}</span>
  return (
    <a href={`https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`} target="_blank" rel="noopener noreferrer"
      aria-label={`Escribir por WhatsApp${name ? ` a ${name}` : ''} al ${phone}`}
      className={actionStyles('secondary', className)}>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="#25D366">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.300-2.900c-.2-.4.2-.4.6-1.200.1-.2 0-.3 0-.5l-.8-1.800c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.900 2.900 0 0 0-.9 2.200c0 1.300.9 2.500 1 2.700.2.200 1.900 2.900 4.600 4 1.700.7 2.300.7 3.200.6.500-.1 1.500-.6 1.700-1.200.2-.600.2-1.100.200-1.200-.1-.100-.3-.200-.5-.300Z" />
      </svg>
      {label}
    </a>
  )
}
