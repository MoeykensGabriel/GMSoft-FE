# GMSoft — Frontend

Panel de administracion y app de reparto para GMSoft. React + Vite + TypeScript,
contra el backend en [GMSoft-BE](https://github.com/MoeykensGabriel/GMSoft-BE).

## Arquitectura

Screaming Architecture: el arbol de `src/` cuenta de que se trata el negocio, no que
tecnologia se uso.

```
src/
  app/                  raiz de composicion: providers y router global
  assets/               estaticos globales
  modules/
    core/               todo lo tecnico y agnostico al negocio
      components/       primitivos de UI (Button, Field)
      lib/              clientes e instancias globales (api, queryClient)
      utils/            formateadores puros (dinero, fechas)
    auth/               primer modulo de dominio
      components/       UI propia del modulo
      hooks/            logica de negocio del modulo
      services/         llamadas a la API y contratos
      states/           estado del modulo
      views/            pantallas completas, mapeadas en el router global
```

Tres reglas que sostienen esto:

**Cada modulo se importa por su `index.ts`.** Lo que no se exporte ahi es privado,
aunque el archivo exista.

**`core` es puramente tecnico.** Si algo de ahi empieza a saber de envases, choferes o
saldos, no pertenece a `core`.

**Las carpetas se crean cuando hacen falta.** Un modulo que solo necesita
`components/` y `hooks/` no lleva el resto vacias.

Los limites no dependen del criterio de nadie: los verifica dependency-cruiser.

```bash
npm run arch
```

## Correr en local

```bash
npm install
npm run dev
```

Levanta en `http://localhost:3000`, que es el origen que el backend permite por
defecto en su CORS. La URL de la API va en `.env` (partir de `.env.example`).
El backend tiene que estar corriendo.

## Preparar el reparto desde ADMIN

En el menú lateral:

1. **Vehículos**: crear nombre, patente, tipo y kilometraje. Se pueden editar;
   el kilometraje no puede retroceder.
2. **Choferes**: crear la ficha con nombre, apellido, documento y teléfono,
   asignar un vehículo y definir usuario y contraseña. El email es opcional.
   La cuenta con rol Driver se crea junto con la ficha. Desde la edición se puede
   cambiar el vehículo, activar/desactivar el acceso y restablecer la contraseña.
   Usuario y email son de consulta después del alta.
3. **Productos** y **Zonas de reparto**: configurar el catálogo y las zonas.
4. **Clientes**: cargar los clientes, su vehículo, zona y días de visita.
5. **Carga inicial**: preparar los productos llenos y los días que cubrirá la salida.

Con un vehículo asignado y cargado, el chofer puede iniciar sesión, ingresar los
kilómetros y elegir su zona. **Home** muestra los camiones con salida abierta.
**Salidas y recepción** permite recibir los llenos sobrantes y los vacíos al volver.

Las altas y las asignaciones pertenecen a `vehicles` y `drivers`. La preparación
de la carga se compone en `vehicleLoads`, para evitar dependencias circulares
entre los módulos de choferes y vehículos.

## Comandos

- `npm run dev` — desarrollo
- `npm run build` — chequeo de tipos y build de produccion
- `npm run lint` — oxlint
- `npm run arch` — limites entre modulos
