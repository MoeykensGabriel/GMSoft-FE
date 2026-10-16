import { sessionService } from '../services/sessionService'

/** La recepción de una salida cerrada, con su historial de correcciones. */
export const receptionQuery = (sessionId: string, enabled = true) => ({
  queryKey: ['sessions', 'reception', sessionId],
  queryFn: () => sessionService.getReception(sessionId),
  enabled,
})
