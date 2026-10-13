# Visita sin compra

Contrato backend: [GM-SoftBE/docs/no-purchase.md](../../GM-SoftBE/docs/no-purchase.md).

La ficha reemplaza Posponer por No compró. El modal compartido conserva su tamaño:
seis radios, nota hasta 300 caracteres y obligatoria para Otro. Confirmar se habilita
con datos válidos. Un ref bloquea doble envío antes del siguiente render; cuerpo y
clientRequestId permanecen congelados tras respuesta incierta. Reintentar usa ambos
sin cambios. Solo 400/403/404/409 habilitan Corregir datos; Volver conserva los datos.
Abrir/cerrar el modal no escribe. Un éxito vuelve al recorrido e invalida clientes,
salida actual y consultas de sessions (incluidas visitas y sin visitar).

Los motivos y tipos compartidos están en customers/utils/noPurchase.ts, exportados
por customers/index.ts para evitar ciclos entre sessions y deliveries. La visita
sigue visible en el historial después de una venta. La columna Compras usa
lastNoPurchase del backend y fecha dd/mm en la zona horaria del negocio.

Sin visitar usa la clave ['sessions', 'unvisited-customers', sessionId], orden del
backend y refresco cada 30 segundos. El aviso de recepción no bloquea el botón,
ni siquiera si esa consulta falla. Las marcas históricas de pospuesto y el servicio
se conservan, pero ninguna pantalla del recorrido las ofrece ni las etiqueta.
Liquidación muestra noPurchases en renglones sin cantidad ni importe; sus totales
siguen calculándose únicamente con lines, returnedContainers y pagos.

Verificación: npm.cmd run build, npm.cmd run lint y npm.cmd run arch sin errores
ni advertencias; node --test, 31/31. Las pruebas nuevas cubren motivos, límite,
nota, doble toque, respuesta incierta, corrección y claves de caché. No hubo revisión
visual en navegador: la herramienta de esta sesión no tiene navegadores disponibles.
No se utilizó el servidor de desarrollo del puerto 3000 ni la API del 5142.

## Archivos de esta implementación

C = creado; M = modificado.

### docs

- C: [docs/no-purchase.md](../docs/no-purchase.md)

### src/modules/customers

- M: [src/modules/customers/components/CustomerCard.tsx](../src/modules/customers/components/CustomerCard.tsx)
- M: [src/modules/customers/components/CustomerRouteList.tsx](../src/modules/customers/components/CustomerRouteList.tsx)
- M: [src/modules/customers/index.ts](../src/modules/customers/index.ts)
- M: [src/modules/customers/services/customerService.ts](../src/modules/customers/services/customerService.ts)
- M: [src/modules/customers/views/CustomerListView.tsx](../src/modules/customers/views/CustomerListView.tsx)
- C: [src/modules/customers/utils/noPurchase.ts](../src/modules/customers/utils/noPurchase.ts)

### src/modules/deliveries

- M: [src/modules/deliveries/hooks/useRegisterDelivery.ts](../src/modules/deliveries/hooks/useRegisterDelivery.ts)
- M: [src/modules/deliveries/services/deliveryService.ts](../src/modules/deliveries/services/deliveryService.ts)
- M: [src/modules/deliveries/views/CustomerVisitView.tsx](../src/modules/deliveries/views/CustomerVisitView.tsx)
- C: [src/modules/deliveries/components/NoPurchaseAction.tsx](../src/modules/deliveries/components/NoPurchaseAction.tsx)
- C: [src/modules/deliveries/hooks/useNoPurchaseWrite.ts](../src/modules/deliveries/hooks/useNoPurchaseWrite.ts)

### src/modules/sessions

- M: [src/modules/sessions/components/DetailedSettlementPanel.tsx](../src/modules/sessions/components/DetailedSettlementPanel.tsx)
- M: [src/modules/sessions/services/sessionService.ts](../src/modules/sessions/services/sessionService.ts)
- M: [src/modules/sessions/views/CurrentSessionView.tsx](../src/modules/sessions/views/CurrentSessionView.tsx)
- M: [src/modules/sessions/views/ReceiveSessionView.tsx](../src/modules/sessions/views/ReceiveSessionView.tsx)
- M: [src/modules/sessions/views/SessionDetailView.tsx](../src/modules/sessions/views/SessionDetailView.tsx)
- C: [src/modules/sessions/components/UnvisitedCustomersPanel.tsx](../src/modules/sessions/components/UnvisitedCustomersPanel.tsx)

### tests

- C: [tests/noPurchase.test.mjs](../tests/noPurchase.test.mjs)
