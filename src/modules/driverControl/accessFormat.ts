export type AccessKind = 'Login' | 'Logout' | 'Rejected'
export type AccessReason = 'Manual' | 'ReceptionCompleted' | 'DepartureCancelled' | 'Expired' | 'CredentialsChanged' | 'Deactivated'
export type AccessClient = 'Unknown' | 'Browser' | 'InstalledApp' | 'EmbeddedBrowser'
export type AccessLoss = 'None' | 'NoExitRecorded' | 'DataCleared'
export type AccessTone = 'success' | 'navigation' | 'neutral' | 'warning' | 'danger'

export interface AccessEventView { kind: AccessKind; reason: AccessReason | null; loss: AccessLoss }

/** Qué pasó, en pocas palabras y con su color. `note` explica una sesión perdida. */
export function describeAccess(e: AccessEventView): { label: string; tone: AccessTone; note?: string } {
  if (e.kind === 'Login') {
    if (e.loss === 'DataCleared') return { label: 'Entró de nuevo', tone: 'danger',
      note: 'Se le había cerrado sola: el celular borró los datos de la página, o entró desde otro navegador.' }
    if (e.loss === 'NoExitRecorded') return { label: 'Entró de nuevo', tone: 'warning',
      note: 'Sin salida registrada antes: cerró sin señal o la app se cerró sin avisar.' }
    return { label: 'Entró', tone: 'success' }
  }
  switch (e.reason) {
    case 'ReceptionCompleted': return { label: 'Recepción del camión', tone: 'navigation' }
    case 'DepartureCancelled': return { label: 'Salida anulada', tone: 'neutral' }
    case 'Expired': return { label: 'Venció el acceso', tone: 'warning' }
    case 'CredentialsChanged': return { label: 'Cambió su contraseña o usuario', tone: 'neutral' }
    case 'Deactivated': return { label: 'Cuenta desactivada', tone: 'danger' }
    default: return { label: 'Cerró sesión', tone: 'neutral' }
  }
}

/** Desde dónde entró. Nada si no se sabe. */
export function clientLabel(client: AccessClient): { label: string; tone: AccessTone } | null {
  switch (client) {
    case 'InstalledApp': return { label: 'App instalada', tone: 'success' }
    case 'Browser': return { label: 'Navegador', tone: 'neutral' }
    case 'EmbeddedBrowser': return { label: 'Dentro de otra app', tone: 'warning' }
    default: return null
  }
}
