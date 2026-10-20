# Arquitectura del frontend

Revisión del código disponible el **20 de octubre de 2026**. [Índice general](../../GM-SoftBE/docs/README.md).

React 19, TypeScript, Vite y TanStack Query sostienen una sola SPA con dos experiencias: **ADMIN en `/panel`** y **chofer en `/reparto`**. Para el stack completo, los datos, las transacciones del servidor y Docker, ver la [arquitectura técnica](../../GM-SoftBE/docs/arquitectura-tecnica/arquitectura-tecnica.md). La identidad visual está en [design-system.md](design-system.md).

## Composición y módulos

[`src/app`](../src/app) conecta providers, autenticación, router y pantallas administrativas compuestas. [`providers.tsx`](../src/app/providers.tsx) monta `QueryClientProvider`, `BrowserRouter` y `AuthProvider`. Las capacidades viven en [`src/modules`](../src/modules).

| Módulo | Responsabilidad |
| --- | --- |
| `core` | Componentes técnicos, cliente HTTP, errores, formatos, QueryClient y bandeja de envíos. |
| `auth` | Login, identidad de la cuenta y protección de rutas por rol. |
| `customers` | Ficha, cuenta, envases, actividad, días, bajas y lista de clientes. |
| `deliveries` | Formulario de visita, venta, devoluciones, préstamos y “No compró”. |
| `sessions` | Apertura, hoja, orden del chofer, estado de salida, recepción, rendición y resumen diario. |
| `vehicleLoads` | Carga inicial, cargas bajadas y recargas. |
| `promotions` | Registro y cierre de pruebas; consulta y plazo administrativo. |
| `routePlanning` | Orden y asignaciones de oficina; avisos de cobertura. |
| `schedule` | Contratos y consultas de agenda semanal y zona sugerida. |
| `vehicles` | Flota, edición y composición de la agenda del vehículo. |
| `drivers` | Ficha del chofer, vehículo y cuenta de acceso. |
| `products` | Catálogo, precio, seguimiento y condición de prestable. |
| `zones` | Zonas de reparto. |
| `workingHours` | Horario semanal, excepciones y presentación de operaciones fuera de horario. |
| `reports` | Rendimiento por camión y gráficos. |

Dentro de los módulos aparecen `views`, `components`, `services`, `hooks`, `states` y `utils`, según lo que necesitan. No todos tienen todas las carpetas. Una vista compone la pantalla; un servicio encapsula HTTP; los hooks coordinan consultas o escrituras. Las reglas específicas del negocio quedan en su módulo y el backend sigue validándolas.

## Dependencias y entradas públicas

La regla es **importar otro módulo por su `index.ts`**, por ejemplo `../../sessions`. Un módulo puede usar libremente sus propios archivos internos. No debe depender de una vista o un servicio privado de otro.

[`.dependency-cruiser.cjs`](../.dependency-cruiser.cjs) aplica estos controles:

| Regla | Qué comprueba |
| --- | --- |
| `sin-internos-de-otro-modulo` | Entre módulos, permite el módulo propio o el `index.ts` del ajeno. |
| `admin-solo-desde-el-panel` | Solo archivos bajo `src/app/admin/` pueden importar un `admin.ts` de módulo. |
| `core-no-conoce-el-negocio` | `core` no importa los demás módulos, aunque sea por su índice. |
| `los-modulos-no-conocen-la-app` | Los módulos no importan `src/app`. |
| `sin-ciclos` | Prohíbe dependencias circulares. |
| `sin-huerfanos` | Advierte sobre archivos sin uso, con las exclusiones declaradas para tipos. |

La primera regla parte de `src/modules`; no es una prohibición global de cualquier import profundo desde `app`. La composición administrativa usa expresamente `admin.ts`. Las reglas se verifican con `npm run arch` y también están en CI.

`core` provee mecanismos, no precios, decisiones de stock ni permisos de negocio. Su outbox recibe un sobre de envío con identificadores, cuerpo opaco y claves de consultas. El módulo de visitas construye ese sobre y decide qué representa.

## Panel separado y carga diferida

[`router.tsx`](../src/app/router.tsx) protege las rutas y carga `AdminRoutes` con `lazy` y `Suspense` al entrar a `/panel/*`.

Los módulos que tienen [`admin.ts`](../src/modules/products/admin.ts) exportan allí pantallas administrativas. Su `index.ts` mantiene lo que necesitan las otras capacidades. [`AdminRoutes`](../src/app/admin/AdminRoutes.tsx) importa esas entradas administrativas y compone menú y pantallas. Algunos módulos, como `vehicleLoads` y `routePlanning`, todavía exponen vistas por su índice: no todos los índices están separados de la misma manera.

Estadísticas tiene otra carga diferida para la vista con Recharts. Esta estructura evita que el árbol del panel completo se importe de entrada desde el router del chofer; el contenido real de cada bundle depende de lo alcanzable por sus imports. Al agregar exports, revisá que el índice compartido no arrastre nuevas pantallas de oficina.

Las rutas protegidas mejoran la navegación. El permiso efectivo lo controla la API. Ocultar un botón no autoriza una operación.

## Estado remoto con TanStack Query

[`queryClient.ts`](../src/modules/core/lib/queryClient.ts) comparte una caché en memoria. Por defecto, los datos quedan frescos 30 segundos, no se recargan al recuperar foco y los errores 4xx no se reintentan. Para otros errores admite hasta dos reintentos. Cada consulta puede reemplazar esas opciones.

Las claves incluyen filtros e identificadores cuando corresponde. No reutilices una misma clave para respuestas con distinta forma. Por ejemplo, `['vehicles', 'all']` debe conservar el contrato de lista completa.

Después de escribir se invalidan las consultas afectadas. No alcanza con modificar el contador visible: la ficha, el saldo, el stock y los reportes pueden depender de la misma operación.

La salida actual y su estado se consultan cada 30 segundos, al recuperar foco y al reconectar. Home consulta salidas abiertas cada 60 segundos y ofrece actualización manual. Los editores de orden conservan una versión estable mientras se edita; no reemplazan el borrador con refrescos automáticos.

No hay persistencia de la caché de Query configurada. Tener una consulta en memoria no garantiza disponer de ella después de cerrar la app o recargar sin señal.

## Cuenta y salida son estados distintos

[`AuthProvider`](../src/modules/auth/states/AuthProvider.tsx) guarda token e identidad visual en `localStorage`. Al entrar o salir limpia QueryClient. Escucha cambios de almacenamiento entre pestañas del mismo origen. Dos pestañas normales comparten cuenta; para probar ADMIN y chofer a la vez usá perfiles de navegador separados.

[`api.ts`](../src/modules/core/lib/api.ts) centraliza `fetch`, autorización y lectura de errores. Un `401` de la cuenta todavía actual cierra su acceso; un `403` muestra falta de permiso sin desloguear. Una respuesta vieja no debe cerrar una cuenta que cambió durante el pedido.

[`DriverSessionLayout`](../src/modules/sessions/views/DriverSessionLayout.tsx) acompaña todas las pantallas del chofer. Recuerda la salida, consulta su estado y renueva el token con keep-alive cada 60 segundos mientras sigue abierta. El keep-alive necesita un token válido: no reemplaza un refresh token independiente.

Cuando detecta `Closed` o `Cancelled`, limpia la referencia activa y los avisos de recarga, cierra la cuenta y vuelve al login. Un error de red o una respuesta vacía no prueban recepción. Cerrar el navegador o vencer la autenticación no cierra `DeliverySession`.

## Guardado local: alcance de cada dato

| Dato | Dónde y cómo se separa | Duración y límite |
| --- | --- | --- |
| Token e identidad | `gmsoft.token`, `gmsoft.user`, en `localStorage` del origen. | Una cuenta compartida por las pestañas del mismo perfil. No son claves separadas por salida. |
| Salida activa | `gmsoft.departure.<userId>`. | Recuerda el ID por usuario; el estado real se consulta a la API. |
| Avisos de recarga vistos | `gmsoft.restocks.seen.<userId>`, con `sessionId` e IDs vistos. | Cambiar de salida reemplaza las marcas anteriores de ese usuario. Tiene respaldo en memoria. |
| Visitar más tarde | `gmsoft.route.later.<sessionId>`. | Por salida y celular/origen. No incorpora el usuario a la clave ni cambia el servidor. Una salida nueva empieza sin pospuestos. |
| Bandeja de visitas | `gmsoft.outbox.<userId>.<clientRequestId>`; cada elemento contiene `sessionId`. | Persiste al recargar o volver a entrar, si el almacenamiento funciona. Conserva la salida original. |
| Modo Vender/Promociones | `gmsoft.reparto.modo`, en `sessionStorage`. | Por pestaña; esta clave no está separada por usuario ni por salida. |
| Borrador de Organizar recorrido | Estado React de la pantalla. | No persiste al cerrar o recargar; no usa outbox. |

Estas separaciones organizan los datos locales; no son una barrera criptográfica. No hay cifrado local implementado. La autorización y la pertenencia de la salida se comprueban en el servidor.

## Bandeja de envíos del celular

[`core/lib/outbox.ts`](../src/modules/core/lib/outbox.ts) almacena un registro por envío antes de mandarlo. [`visitOutbox.ts`](../src/modules/deliveries/utils/visitOutbox.ts) arma el sobre para `/api/deliveries`: usuario, salida, cliente cuando existe, descripción, cuerpo y consultas a invalidar.

El cuerpo conserva `clientRequestId` y `expectedSessionId`. El primero permite recuperar una visita ya registrada sin repetir sus efectos. El segundo evita aplicar una visita pendiente a una salida nueva. El backend valida ambas cosas; la bandeja sola no da esa garantía.

El circuito es:

1. El módulo congela el pedido y lo guarda antes de enviarlo.
2. Si llega la confirmación, quita el pendiente e invalida las consultas.
3. Si falla la red o la respuesta es incierta, conserva el mismo cuerpo y la misma clave.
4. [`OutboxSender`](../src/modules/core/components/OutboxSender.tsx) reenvía al montarse, cada 30 segundos y en el evento `online`, con la app activa.
5. Reenvía secuencialmente los pendientes del usuario. Si cambia el token durante la pasada, se detiene.
6. Los 4xx definitivos marcan `failed`, salvo `401`, `408` y `429`, que conservan el pendiente. Un fallo incierto detiene esa pasada.

La exclusión de envíos simultáneos está en memoria de la instancia JavaScript; no es un bloqueo global entre pestañas. La idempotencia del servidor sigue siendo necesaria.

Si `localStorage` rechaza escrituras, existe respaldo en memoria. La pantalla de venta avisa que no debe cerrarse hasta confirmar. La memoria no sobrevive a una recarga. Los rechazos definitivos que muestra la bandeja requieren revisión con oficina; no se eliminan automáticamente como si hubieran llegado.

Usan esta bandeja ventas, visitas de envases/préstamos y “No compró”. Las promociones, bajas y el guardado del orden tienen sus propios controles de intento; no debe prometerse recuperación automática duradera para todas las operaciones.

[`sw.js`](../public/sw.js) es mínimo y lleva las navegaciones a la red. No cachea toda la app ni descarga clientes y precios para trabajar completamente sin conexión. Tampoco procesa la outbox con el navegador cerrado.

## CSP, nginx y construcción

[`vite.config.ts`](../vite.config.ts) genera la CSP como `<meta>` solo durante el build. Permite scripts propios, estilos propios e inline y conexiones al origen de API definido por `VITE_API_URL`. Restringe objetos, base, formularios y workers. Desarrollo usa otra dinámica para la recarga en caliente y no recibe esta meta del plugin.

`VITE_API_URL` es público y queda incorporado al build, incluida la CSP. Cambiarlo exige reconstruir la web. Nunca se usa para secretos. API y web deben coincidir también en el origen permitido por CORS.

[`nginx.conf.template`](../nginx.conf.template) sirve los estáticos y devuelve `index.html` para rutas SPA. No define un proxy `/api`; el navegador llama directamente a la API configurada.

- `index.html`: `no-store`.
- `/assets/`: caché de un año e `immutable`.
- Service worker y manifiesto: `no-cache`.
- Documento: cabeceras de framing, `nosniff`, política de referencia, permisos y HSTS. `frame-ancestors` se entrega por cabecera; no reemplaza la CSP completa de Vite.

Las cabeceras se repiten en las ubicaciones del documento. No todas las ubicaciones de assets o service worker tienen el mismo conjunto. El puerto se sustituye al arrancar nginx; el [Dockerfile](../Dockerfile) establece 8080 como valor por defecto. Para despliegue y TLS, seguí la [guía de operación](../../GM-SoftBE/docs/operacion.md).

## Cómo se verifica

Desde la raíz de `GM-SoftFE`, con Node y npm:

```bash
npm ci
npm test
npm run lint
npm run arch
npm run build
```

En PowerShell podés usar `npm.cmd` si la política de ejecución bloquea `npm.ps1`.

| Comando | Alcance |
| --- | --- |
| `npm test` | Ejecuta `node --test tests/*.test.mjs`. Hay pruebas de cálculos, contratos, orden, préstamos, recepción y comportamiento de la outbox con almacenamiento/HTTP simulados. Varias transpilan el TypeScript real para probarlo en Node. |
| `npm run lint` | Ejecuta oxlint. |
| `npm run arch` | Ejecuta dependency-cruiser con las reglas del repositorio. |
| `npm run build` | Ejecuta `tsc -b` y después `vite build`: chequeo de tipos y artefacto de producción. |

[CI](../.github/workflows/ci.yml) corre instalación, lint, build, tests y arquitectura con Node 22. Que exista el workflow no demuestra que la última ejecución haya pasado.

Estas pruebas no sustituyen recorrer la pantalla real. Al cambiar un flujo, revisá celular y escritorio, teclado, estados vacíos, errores, confirmaciones y cortes de red. Usá datos ficticios y un entorno de prueba. Las pruebas de integración y recorridos HTTP del backend están en su [guía de testing](../../GM-SoftBE/docs/testing.md).

## Al agregar una función

Ubicala en el módulo responsable. Exponé solo el contrato necesario por el índice; reservá `admin.ts` para la composición del panel. Reutilizá componentes técnicos de `core` y componentes de negocio del propio módulo. No lleves reglas de venta a un botón compartido.

Definí claves de Query e invalidaciones. Si hay escritura desde celular, decidí expresamente si necesita bandeja persistente, idempotencia y vínculo con la salida. Conservá cuerpo y clave ante respuestas inciertas. Verificá límites de dependencias y build antes de integrar.
