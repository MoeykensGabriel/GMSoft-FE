import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SESION_ACTUAL } from '../../sessions'
import { deliveryService } from '../services/deliveryService'
import type { RegisterDeliveryRequest } from '../services/deliveryService'

export function useRegisterDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: RegisterDeliveryRequest) => deliveryService.register(body),
    onSuccess: () => {
      // La visita movio el stock del camion y la cuenta del cliente: lo cacheado
      // quedo viejo en el mismo instante en que el backend respondio.
      queryClient.invalidateQueries({ queryKey: SESION_ACTUAL })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}
