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

## Comandos

- `npm run dev` — desarrollo
- `npm run build` — chequeo de tipos y build de produccion
- `npm run lint` — oxlint
- `npm run arch` — limites entre modulos
