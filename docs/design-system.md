# Sistema visual de GMSoft

Interfaz sobria de gestión: superficies blancas sobre gris claro, estructura azul,
encabezados de tablas turquesa, bordes finos y tipografía Arial. Sin animaciones
ni sombras decorativas. ADMIN prioriza comparar datos en escritorio; el chofer
prioriza controles fáciles de tocar en el celular.

## Una fuente para la identidad

Los tokens semánticos y las clases `ui-*` se definen en `src/index.css`, mediante
`@theme` de Tailwind. Cambiar un color allí actualiza todos los módulos.

| Token | Uso |
| --- | --- |
| `brand`, `brand-dark` | Cabeceras, navegación y títulos |
| `accent`, `accent-soft` | Tablas, foco, selección y encabezados secundarios |
| `canvas`, `surface`, `surface-alternate` | Fondo, tarjetas y filas alternadas |
| `ink`, `muted`, `line` | Texto principal, texto secundario y bordes |
| `success` | Crear y confirmar |
| `danger` | Eliminar, cancelar, deshacer y errores |
| `warning` | Situaciones que requieren atención |

Usar estos nombres en lugar de colores concretos dentro de una pantalla.
Los estados blanco/rojo/negro de clientes representan reglas del negocio y se
conservan, siempre acompañados por un texto que explica la situación.

## Componentes compartidos

Se importan desde `modules/core`, a través de su `index.ts`:

- `Page` y `PageHeader`: estructura de pantalla, título, descripción y acciones.
- `Panel`: sección con superficie blanca y encabezado secundario opcional.
- `Button`: acciones; `primary` verde, `danger` rojo, `secondary` neutro,
  `navigation` azul. Elegir según la intención, no según el color preferido.
- `LinkButton`: la misma apariencia para enlaces reales de navegación.
- `Field`, `Select`, `Textarea`: etiquetas visibles, IDs únicos y errores asociados.
- `QuantityInput`: cantidades con entrada numérica y botones de sumar/restar.
- `WeekdaysField`: selección de días con estado marcado visible.
- `DataTable`: tabla semántica con título accesible y desplazamiento local.
  Cada módulo define sus columnas con `thead`, `tbody` y `th scope="col"`.
- `Badge` y `ErrorMessage`: estados y errores con texto, además del color.
- `Modal`: diálogo nativo con fondo inactivo, Escape y cierre al tocar afuera.
  Mientras se envía, bloquea el cierre. Abrirlo no registra operaciones.

`actionStyles` centraliza la apariencia de `Button` y `LinkButton`; no duplicar
su lista de clases en cada módulo. Las cantidades, saldos y decisiones sobre
ventas siguen perteneciendo a sus módulos de dominio, nunca a `core`.

## Tamaños y adaptación

Mantener los espacios con la escala de Tailwind y los patrones de los componentes.
Los formularios se apilan en móvil y pueden distribuirse en columnas en escritorio.
En móvil, los controles tienen al menos 44 px y los campos usan 16 px de fuente.
Dentro de ADMIN, desde 768 px los controles pueden reducirse a 36 px y los campos
usan 14 px. El menú lateral se abre mediante un botón en pantallas pequeñas.

Las tablas anchas se desplazan dentro de `DataTable`; no deben ensanchar toda la
página. El listado del chofer mantiene Cliente / Dirección / Deuda y permite
abrir la ficha tocando toda la fila. No reutilizar la densidad de escritorio allí.

## Ampliar una pantalla

1. Componer el encabezado, filtros y contenido con los componentes existentes.
2. Mantener consultas, validaciones y reglas dentro del módulo correspondiente.
3. Si aparece un patrón repetido, extraerlo a un componente del módulo; llevarlo
   a `core` solo cuando sea independiente del negocio.
4. Conservar etiquetas, foco visible, mensajes de error y botones con nombres claros.
5. Verificar `npm run build`, `npm run lint` y `npm run arch`; revisar en navegador
   escritorio y móvil, incluidos estado vacío, error y modales cuando apliquen.

## Verificación de esta implementación

Compilación, lint y límites entre módulos validados. Revisión visual con una API
local de datos ficticios: ADMIN en escritorio y pantalla pequeña; listado,
ficha y venta del chofer en 390 px y formulario de venta en 320 px. Se comprobó
el cálculo de subtotales, la elección de cobro y que volver del modal conserve
las cantidades. No se modificó la base de datos del servidor Linux.
