import { useLocation } from 'react-router-dom'
import { LinkButton, Page, PageHeader } from '../../core'
import { ActiveDeparturesCard } from '../components/ActiveDeparturesCard'

/**
 * La mañana: abrir salidas y ver los camiones que ya están en la calle, en el orden
 * en que salieron. La recepción de la tarde tiene su propia página.
 */
export function SessionListView() {
  // Aviso de vuelta desde «Anular salida».
  const anulada = (useLocation().state as { cancelled?: string } | null)?.cancelled

  return <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
    <PageHeader title="Salidas" description="Abrí las salidas de la mañana y seguí a los camiones que están en la calle."
      actions={<LinkButton to="/panel/salidas/abrir" variant="primary">Abrir salida</LinkButton>} />
    {anulada && <p role="status" className="ui-card bg-accent-soft p-3 text-sm">
      Se anuló la salida de {anulada}. La carga volvió a quedar pendiente en el camión.
    </p>}
    <ActiveDeparturesCard />
  </Page>
}
